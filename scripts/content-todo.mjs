// Prints what the operator still has to send (see docs/content-todo.md).
import { collectTodos } from '../src/data/todo.ts';

const todos = collectTodos();
console.log(`Content still needed from the operator: ${todos.length} item(s)\n`);
for (const { path, needed } of todos) console.log(`- ${path}\n    ${needed}`);
