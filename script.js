const todoStorage = {    
    get() {
        const todoList = JSON.parse(localStorage.getItem('todoList')) || [];
        return todoList;
    },
    
    set() {
        localStorage.clear();
        localStorage.setItem('todoList', JSON.stringify(todo.todoList));
    }
};

const handlers = {
    addTodo(event) {  
        const text = document.getElementById('todo-input');
        if (event.target.id === 'todo-input' && event.target.value) {
            todo.addTodo(text.value);
        } else if (event.target.className === 'adder') {
            handlers.addChildTodo(event);
        }
        text.value = '';
    },
    
    onEnter(event) {
        if (event.keyCode === 13) {
            this.addTodo(event);
        }
    },
    
    getChildren(todoChild, list = todo.todoList, match = null) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === todoChild) {
                match = [list, i];
            } else if (match === null && list[i].children.length) {
                match = this.getChildren(todoChild, list[i].children);
            }
        }
        return match;
    },
    
    deleteTodo(event) {
        const todoChild = this.getTodo(event.target.id);
        const parentTodo = this.getChildren(todoChild);
        const arr = parentTodo[0];
        const index = Number(parentTodo[1]);
        const parent = this.getParentTodo(todoChild);   
        todo.deleteTodo(arr, index);
        if (parent && parent.children.length) {
            view.showCompletedParent(parent);   
        }
        view.showTodo();
    },
    
    editTodo(event) { 
        if(event.target.className === 'label') {
            event.target.parentElement.classList.add('editing');
            const newInput = event.target.nextElementSibling.nextElementSibling;
            newInput.value = event.target.textContent;
            view.putCaretAtTheBeginning(newInput);
        }
    },
       
    toggleSingleTodo(event) {
        if (event.target.className === 'toggle') {
            todo.toggleSingleTodo(event); 
        }
    },
    
    onKeyUp(event) {
        event.target.setAttribute('data-text', event.target.value);
        if (event.keyCode === 13) {
            event.target.parentElement.classList.remove('editing');

        } else if (event.keyCode === 27) {
            event.target.removeAttribute('data-text');
            event.target.parentElement.classList.remove('editing');
        }
    },
    
    checkUpdate(event) {
        if (event.target.className.includes('edit')) {
            this.update(event);
        }
    },
    
    update(event) {
        if (event.target.dataset.text) {
            const todoId = event.target.parentNode.id;
            const todo = this.getTodo(todoId);
            todo.text = event.target.dataset.text;
            todoStorage.set();
            view.showTodo();   
        }
        event.target.parentElement.classList.remove('editing');
    },
              
    checkAddChildTodo(event) {
        if (event.target.className === 'adder') {
            this.addTodo(event);
        }
    },
    
    addChildTodo(event) {
        const parentTodo = this.getTodo(event.target.id);
        parentTodo.children.push(todo.createTodo('enter your subtodo'));
        view.showCompletedParent(parentTodo);
        todoStorage.set();
        const allParentTodos = todo.getAllParentTodos(parentTodo.id);
        allParentTodos.forEach(parent => {
            view.showCompletedParent(parent); 
        });
        view.showTodo();
    },
    
    getTodo(id, list = todo.todoList, match = null) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                match = list[i];
            } else if (match === null && list[i].children.length) {
                match = this.getTodo(id, list[i].children);
            }
        }
        return match;
    },
    
    getParentTodo(todoChild, list = todo.todoList, match = null) {
        for (let i = 0; i < list.length; i++) {
            list[i].children.forEach(child => {
                const parent = list[i];
                if (child.id === todoChild.id) {
                    match = parent;
                }
            });
            if (match === null && list[i].children.length) {
                match = this.getParentTodo(todoChild, list[i].children);
            }
        }
        return match;
    }   
};

const view = {
    showTodo(list = todo.todoList, ul = document.querySelector('.list')) {
        ul.innerHTML = '';
        let numberOfUncompletedTodos = 0;
        for (let i = 0; i < list.length; i++) {
            if (list[i]) {
                if (list[i].isCompleted.toString() !== 'true') {
                    numberOfUncompletedTodos++;
                }
                const todoLi = view.createTodoLi(list[i], list[i].id);
                ul.appendChild(todoLi);
                if (list[i].children.length) {
                    const todoChildren = list[i].children;
                    if (todoChildren && todoChildren.length) {
                        this.showTodo(todoChildren, todoLi.querySelector(`ul`));
                    }
                }
            }
        }
        this.showFooter(numberOfUncompletedTodos);
    },
    
    showFooter(numberOfUncompletedTodos) {
        const list = document.querySelector('.list');
        const info = list.querySelector('.info') || '';
        if (todoStorage.get().length) {
            if (info) {
                list.removeChild(info);
                info.innerHTML = '';
            }
            list.appendChild(this.createInfo(numberOfUncompletedTodos));
        } 
    },
    
    showCompletedParent(parent) {
        let numberOfCompletedTodos = 0;
        if (parent.children) {
            parent.children.forEach(child => {
                if (child.isCompleted.toString() === 'true') {
                    numberOfCompletedTodos++;
                }
            });
            let numberOfUncompletedTodos = 0;
            numberOfUncompletedTodos = parent.children.length - numberOfCompletedTodos;
            this.setCompletedParentState(numberOfUncompletedTodos, numberOfCompletedTodos, parent);
            todoStorage.set();
        }
    },
    
    setCompletedParentState(numberOfUncompletedTodos, numberOfCompletedTodos, parent) {
        if (numberOfCompletedTodos === parent.children.length) {
            parent.isCompleted = true;
        } else if (numberOfUncompletedTodos && parent.children.length > numberOfUncompletedTodos) {
            parent.isCompleted = 'undecided';
        } else {
            parent.isCompleted = false;
        }
    },
    
    showActive() {
        const list = document.querySelector('.list');
        list.innerHTML = '';
        let numberOfUncompletedTodos = 0;
        
        todo.todoList.forEach((todo, index) => {
            numberOfUncompletedTodos += !todo.isCompleted;
            if (todo.isCompleted !== true) {
                const todoLi = this.createTodoLi(todo, index);
                list.appendChild(todoLi);
            } 
        });  
        list.appendChild(this.createInfo(numberOfUncompletedTodos));
    },
    
    showCompleted() {
        const list = document.querySelector('.list');
        list.innerHTML = '';
        let numberOfUncompletedTodos = 0;
        
        todo.todoList.forEach((todo, index) => {
            numberOfUncompletedTodos += !todo.isCompleted;
            if (todo.isCompleted === true) {
                const todoLi = this.createTodoLi(todo, index);
                list.appendChild(todoLi);
            } 
        });  
        
        list.appendChild(this.createInfo(numberOfUncompletedTodos));
    },
    
    deleteCompleted() {
        todo.todoList.forEach((todoItem, index) => {
            if(todoItem.isCompleted) {
                todo.deleteTodo(todo.todoList, index);
                view.showTodo();
            }
        });
    },
    
    createTodoLi(todo, index) {
        const todoLi = document.createElement('li');
        todoLi.className = 'todo-item';
        todoLi.id = todo.id;
        todoLi.appendChild(this.createTodoLiWrapper(todo, index, todoLi));
        todoLi.appendChild(this.createUl(index));
        return todoLi;
    },
    
    createTodoLiWrapper(todo, index, todoLi) {
        const todoLiWrapper = document.createElement('div');
        todoLiWrapper.classList.add('todo-item-wrapper');
        todoLiWrapper.id = todoLi.id;
        this.appendChildren(todoLiWrapper, [this.createCheckbox(todo, index), this.createLabel(todo),                                                       this.createDeleteButton(todo.id), this.createEditingInput(todoLi),                                             this.createAdder(index)]);
        return todoLiWrapper;
    },
    
    createUl(index) {
        const ul = document.createElement('ul');
        ul.classList.add('list');
        ul.id = index;
        return ul;
    },
    
    createAdder(index) {
        const adder = document.createElement('button');
        const icon = document.createTextNode('+');
        adder.appendChild(icon);
        adder.className = 'adder';
        adder.id = index;
        adder.addEventListener('click', handlers.addTodo);
        return adder;
    },
    
    createCheckbox(todo, index) {
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', handlers.toggleSingleTodo);
        checkbox.className = 'toggle';
        checkbox.id = index;
        checkbox.checked = true ? todo.isCompleted.toString() === 'true' : false;
        return checkbox;
    },
    
    createLabel(todo) {
        const label = document.createElement('label');
        label.textContent = todo.text;
        label.setAttribute('data-text', todo.text);
        label.className = 'label';
        label.addEventListener('dblclick', handlers.editTodo);
        return label;
    },
    
    createDeleteButton(id) {
        const deleteButton = document.createElement('button');
        deleteButton.id = id;
        deleteButton.addEventListener('click', function (id) {
            handlers.deleteTodo(id);
        });
        const icon = document.createTextNode('x');
        deleteButton.appendChild(icon);
        deleteButton.className = 'delete-button';
        return deleteButton;
    },
    
    createInfo(numberOfUncompletedTodos) {
        const info = document.createElement('div');
        info.className = 'info';
        this.appendChildren(info, [this.createInfoText(numberOfUncompletedTodos), this.createInfoButtonBox(),                                      this.createInfoButton('Clear completed', 'view.deleteCompleted()')]);
        return info;
    },
    
    createInfoText(numberOfUncompletedTodos) {
        const infoText = document.createElement('span');
        const text = document.createTextNode(`${numberOfUncompletedTodos}  ${(numberOfUncompletedTodos > 1 || numberOfUncompletedTodos === 0) ? 'items' : 'item'} left`);
        infoText.appendChild(text);
        return infoText;
    },
    
    createInfoButtonBox() {
        const infoButtonBox = document.createElement('div');
        this.appendChildren(infoButtonBox, [this.createInfoButton('All', 'view.showTodo()'),                                                               this.createInfoButton('Active', 'view.showActive()'),                                                           this.createInfoButton('Completed', 'view.showCompleted()')]);
        return infoButtonBox;
    },
    
    createInfoButton(buttonText, method) {
        const infoButton = document.createElement('button');
        infoButton.className = 'info-button';
        infoButton.setAttribute('onclick', method);
        const text = document.createTextNode(buttonText);
        infoButton.appendChild(text);
        return infoButton;
    },
    
    createEditingInput(todo) {
        const input = document.createElement('input');
        input.className = 'edit';
        input.addEventListener('keyup', handlers.onKeyUp);
        input.addEventListener('focusout', handlers.update.bind(handlers));
        return input;
    },
    
    putCaretAtTheBeginning(x) {
        const tmpStr = x.value;
		x.value = '';
		x.value = tmpStr;
		x.focus();  
    },
    
    appendChildren(parent, children) {
        children.forEach(child => {
            parent.appendChild(child);
        });
    }
};
        
const todo = {
    todoList: todoStorage.get(),
    
    uuid() {
	   let i, random;
	   let uuid = '';

	   for (i = 0; i < 32; i++) {
		  random = Math.random() * 16 | 0;
		  if (i === 8 || i === 12 || i === 16 || i === 20) {
              uuid += '-';
          }
		  uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
	   }

	   return uuid;
    },
 
    addTodo(text) {
        this.todoList.push(this.createTodo(text));
        todoStorage.set();
        view.showTodo();
    },
    
    deleteTodo(arr, index) {
        arr.splice(index, 1);
        todoStorage.set();
    },
    
    toggleSingleTodo(event) {
        const todo = handlers.getTodo(event.target.id);
        const parentTodo = handlers.getParentTodo(todo); 
        this.setTodoState(todo);
        if (parentTodo) {
            this.handleParentStateOnToggle(parentTodo, todo);
        }
        todoStorage.set();
        view.showTodo();
    },
    
    handleParentStateOnToggle(parentTodo, todo) {
        view.showCompletedParent(parentTodo);
        this.toggleParentAccordingToChildren(parentTodo);
        this.toggleAccordingToParent(todo);
        const allParentTodos = this.getAllParentTodos(todo.id);
        allParentTodos.forEach(parent => {
            view.showCompletedParent(parent);
        });
    },
    
    setTodoState(todo) {
        if (todo.isCompleted.toString() === 'true') {
            todo.isCompleted = false;
        } else {
            todo.isCompleted = true;
        }    
    },
    
    toggleAccordingToParent(todo) {
        if (todo.children.length) {
            todo.children.forEach(child => {
                child.isCompleted = todo.isCompleted;
                if (child.children.length) {
                    return this.toggleAccordingToParent(child);
                }
            });
        }        
        todoStorage.set();
    },
    
    toggleParentAccordingToChildren(parent) {
        if (parent && parent.children.length) {
            const numberOfChildren = parent.children.length;
            let numberOfChildenWhichAreCompleted = 0;
            parent.children.forEach(child => {
                if (child.isCompleted) {
                    numberOfChildenWhichAreCompleted++;
                }
            });
            if (numberOfChildenWhichAreCompleted === numberOfChildren) {
                parent.isCompleted = true;
            }
            todoStorage.set();
        }  
    },
    
    toggleAll() {
        let numberOfCompletedTodos = 0;
        const numberOfAllTodos = todo.todoList.length;   
        this.todoList.forEach(todo => {
            if (todo.isCompleted.toString() === 'true') {
               numberOfCompletedTodos++;
            }
            todo.isCompleted = numberOfCompletedTodos !== numberOfAllTodos;
            this.toggleAccordingToParent(todo);
        });
        
        todoStorage.set(); 
        view.showTodo();
    },
    
    getAllParentTodos(id) {
        let el = document.getElementById(`${id}`);
        const parents = [];
        while(el.parentNode) {
            el = el.parentNode;
            if (el.tagName === 'LI') {
                parents.push(handlers.getTodo(el.id));
            }
        }
        return parents;
    },
    
    createTodo(text) {
        function Todo(text) {
            this.text = text,
            this.isCompleted = false,
            this.id = todo.uuid(),
            this.children = []    
        }
        
        return new Todo(text);
    }
    
};
