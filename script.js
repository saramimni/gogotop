document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    // 로컬 스토리지에서 할일 목록 불러오기
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // 할일 목록 표시
    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span>${todo.text}</span>
                <button>삭제</button>
            `;

            // 체크박스 이벤트
            const checkbox = li.querySelector('input');
            checkbox.addEventListener('change', () => toggleTodo(index));

            // 삭제 버튼 이벤트
            const deleteBtn = li.querySelector('button');
            deleteBtn.addEventListener('click', () => deleteTodo(index));

            todoList.appendChild(li);
        });
        saveTodos();
    }

    // 할일 추가
    function addTodo(text) {
        todos.push({ text, completed: false });
        renderTodos();
    }

    // 할일 삭제
    function deleteTodo(index) {
        todos.splice(index, 1);
        renderTodos();
    }

    // 할일 완료 토글
    function toggleTodo(index) {
        todos[index].completed = !todos[index].completed;
        renderTodos();
    }

    // 로컬 스토리지에 저장
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 폼 제출 이벤트
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const todoText = todoInput.value.trim();
        if (todoText) {
            addTodo(todoText);
            todoInput.value = '';
        }
    });

    // 초기 렌더링
    renderTodos();
});
