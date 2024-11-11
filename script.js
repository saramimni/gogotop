document.addEventListener('DOMContentLoaded', () => {
    const nicknameContainer = document.getElementById('nickname-container');
    const todoContainer = document.getElementById('todo-container');
    const nicknameInput = document.getElementById('nickname-input');
    const startButton = document.getElementById('start-button');
    const welcomeMessage = document.getElementById('welcome-message');
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let currentUser = null;
    const todosRef = db.collection('todos');

    // 시계 기능
    function updateClock() {
        const now = new Date();
        const clock = document.getElementById('clock');
        const dateDisplay = document.getElementById('date');
        
        clock.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
        dateDisplay.textContent = now.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    // 닉네임 입력 처리
    startButton.addEventListener('click', () => {
        const nickname = nicknameInput.value.trim();
        if (nickname) {
            currentUser = nickname;
            nicknameContainer.style.display = 'none';
            todoContainer.style.display = 'block';
            welcomeMessage.textContent = `${nickname}님 환영합니다!`;
            loadTodos();
        }
    });

    // 나이스 API 호출
    async function fetchSchoolSchedule() {
        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        const url = 'https://open.neis.go.kr/hub/SchoolSchedule';
        const params = new URLSearchParams({
            ATPT_OFCDC_SC_CODE: 'J10',
            SD_SCHUL_CODE: '7530475',
            Type: 'json',
            AA_YMD: formattedDate
        });

        try {
            const response = await fetch(`${url}?${params}`);
            const data = await response.json();
            if (data.SchoolSchedule && data.SchoolSchedule[1]) {
                return data.SchoolSchedule[1].row;
            }
            return [];
        } catch (error) {
            console.error('일정 가져오기 실패:', error);
            return [];
        }
    }

    // 일정 표시
    async function displaySchedule() {
        const schedules = await fetchSchoolSchedule();
        const todayEvents = document.getElementById('today-events');
        const weekEvents = document.getElementById('week-events');
        
        todayEvents.innerHTML = schedules.length ? '' : '<p class="no-events">오늘 일정이 없습니다.</p>';
        weekEvents.innerHTML = schedules.length ? '' : '<p class="no-events">이번 주 일정이 없습니다.</p>';

        schedules.forEach(schedule => {
            const eventElement = `
                <div class="event-item" data-aos="fade-up">
                    <div class="event-content">${schedule.EVENT_NM}</div>
                    <div class="event-date">${schedule.AA_YMD}</div>
                </div>
            `;
            todayEvents.innerHTML += eventElement;
            weekEvents.innerHTML += eventElement;
        });
    }

    // 할일 목록 로드
    function loadTodos() {
        todosRef
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                todoList.innerHTML = '';
                snapshot.forEach((doc) => {
                    const todo = doc.data();
                    const deadline = new Date(todo.deadline);
                    const now = new Date();
                    const timeLeft = deadline - now;
                    
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    const timeLeftStr = timeLeft > 0 ? 
                        `남은 시간: ${hoursLeft}시간 ${minutesLeft}분` : 
                        '마감됨';

                    const li = document.createElement('li');
                    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                    li.setAttribute('data-id', doc.id);
                    
                    li.innerHTML = `
                        <div class="content">
                            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                            <span>${todo.text}</span>
                            <span class="deadline">
                                마감: ${new Date(todo.deadline).toLocaleTimeString()}
                                <br>
                                <span class="time-left">${timeLeftStr}</span>
                            </span>
                        </div>
                        <div class="actions">
                            <button class="delete-btn">삭제</button>
                        </div>
                    `;

                    const checkbox = li.querySelector('input');
                    checkbox.addEventListener('change', () => toggleTodo(doc.id, todo.completed));

                    const deleteBtn = li.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', async () => {
                        try {
                            await db.collection('todos').doc(doc.id).delete();
                            console.log('문서 삭제 성공:', doc.id);
                        } catch (error) {
                            console.error('삭제 중 오류 발생:', error);
                        }
                    });

                    todoList.appendChild(li);
                });
            });
    }

    // 할일 추가
    async function addTodo(text, deadline) {
        try {
            await todosRef.add({
                text,
                completed: false,
                userName: currentUser,
                deadline: deadline,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('할일 추가 중 오류 발생:', error);
        }
    }

    // 할일 삭제
    async function deleteTodo(id) {
        try {
            await db.collection('todos').doc(id).delete();
            console.log('삭제 완료:', id);
        } catch (error) {
            console.error('삭제 중 오류 발생:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }

    // 할일 토글
    async function toggleTodo(id, currentStatus) {
        try {
            await todosRef.doc(id).update({
                completed: !currentStatus
            });
        } catch (error) {
            console.error('할일 상태 변경 중 오류 발생:', error);
        }
    }

    // 폼 제출 이벤트
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const todoText = todoInput.value.trim();
        const deadline = document.getElementById('deadline-input').value;
        const deadlineDate = new Date(deadline);
        const now = new Date();
        
        if (todoText && deadline) {
            // 현재 시간보다 이전 시간을 선택한 경우
            if (deadlineDate < now) {
                alert('현재 시간보다 이후의 시간을 선택해주세요.');
                return;
            }
            
            // 오늘 날짜가 아닌 경우
            if (deadlineDate.toDateString() !== now.toDateString()) {
                alert('오늘 날짜의 과제만 입력할 수 있습니다.');
                return;
            }

            addTodo(todoText, deadline);
            todoInput.value = '';
            document.getElementById('deadline-input').value = '';
        }
    });

    // 엔터키로 닉네임 입력
    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startButton.click();
        }
    });

    // 초기 실행
    setInterval(updateClock, 1000);
    updateClock();
    displaySchedule();
    setInterval(displaySchedule, 1000 * 60 * 60); // 1시간마다 업데이트

    // 날짜 입력 필드 설정
    const deadlineInput = document.getElementById('deadline-input');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 오늘 날짜의 시작 시간과 내일 날짜의 시작 시간을 설정
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    deadlineInput.setAttribute('min', `${todayStr}T00:00`);
    deadlineInput.setAttribute('max', `${todayStr}T23:59`);
});
  
