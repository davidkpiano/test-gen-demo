import { test, expect } from '@playwright/test';
import { matchesState } from 'xstate';

// Test paths for `TodoMVC`
// http://localhost:3000/registry/editor/b13b64f7-cc9c-4035-a692-337bb798a1e6?machineId=9fff6638-3b60-4e22-a34e-cbfc099b64e5

// Start the system under test (`sys`) with the given input (optional)
async function start(page) {
  await page.goto('https://todomvc.com/examples/react/#/');
  return page;
}

// Assert that the system under test (`sys`) is in the correct state
async function assertState(page, state) {
  if (matchesState('Empty todo form', state.value)) {
    // Assert `sys` is in state "TodoMVC.Empty todo form"
    await page.waitForSelector('.new-todo');
  }

  if (matchesState('New todo', state.value)) {
    // Assert `sys` is in state "TodoMVC.New todo"
    // Assert sys is in state TodoMVC.new todo filled out
    const newTodo = await page.waitForSelector('.new-todo');

    if (!newTodo) {
      throw new Error('Could not find new todo input');
    }

    const value = await newTodo.evaluate((el) => el.value);

    expect(value).toEqual('new todo filled out');
  }

  if (matchesState('Single todo', state.value)) {
    const todoItems = await page.$$('.todo-list li');

    expect(todoItems).toHaveLength(1);
  }

  if (matchesState('Multiple todos', state.value)) {
    const todoItems = await page.$$('.todo-list li');

    expect(todoItems).toHaveLength(2);
  }
}

async function executeEvent(page, event, state) {
  // execute the event on the system under test
  switch (event.type) {
    case 'add todo': {
      // Execute the action that results in
      // the "add todo" event occurring
      const newTodo = await page.$('.new-todo');

      if (!newTodo) {
        throw new Error('Could not find new todo input');
      }

      await newTodo.fill('new todo filled out');
      await newTodo.press('Enter');
      break;
    }

    case 'delete todo': {
      // Execute the action that results in
      // the "delete todo" event occurring
      const todoItems = await page.$$('.todo-list li');

      if (!todoItems?.length) {
        throw new Error('Could not find todo items');
      }

      const firstTodo = todoItems[0];

      // mouseover
      await firstTodo.hover();

      const deleteButton = await firstTodo.$('.destroy');

      if (!deleteButton) {
        throw new Error('Could not find delete button');
      }

      await deleteButton.click();
      break;
    }

    case 'fill out todo': {
      // Execute the action that results in
      // the "fill out todo" event occurring
      const newTodo = await page.$('.new-todo');

      if (!newTodo) {
        throw new Error('Could not find new todo input');
      }

      await newTodo.fill('new todo filled out');
      break;
    }

    default: {
      throw new Error(`Unhandled event: ${event.type}`);
    }
  }
}

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole('heading', { name: 'Installation' })
  ).toBeVisible();
});

test('Reaches state TodoMVC.Single todo', async ({ page }) => {
  const sys = await start(page);

  await test.step(`Assert state "Empty todo form"`, async () => {
    await assertState(sys, { value: 'Empty todo form' });
  });

  await test.step(`Execute event {"type":"fill out todo"}`, async () => {
    await executeEvent(sys, { type: 'fill out todo' }, { value: 'New todo' });
  });

  await test.step(`Assert state "New todo"`, async () => {
    await assertState(sys, { value: 'New todo' });
  });

  await test.step(`Execute event {"type":"add todo"}`, async () => {
    await executeEvent(sys, { type: 'add todo' }, { value: 'Single todo' });
  });

  await test.step(`Assert state "Single todo"`, async () => {
    await assertState(sys, { value: 'Single todo' });
  });

  await test.step(`Execute event {"type":"add todo"}`, async () => {
    await executeEvent(sys, { type: 'add todo' }, { value: 'Multiple todos' });
  });

  await test.step(`Assert state "Multiple todos"`, async () => {
    await assertState(sys, { value: 'Multiple todos' });
  });

  await test.step(`Execute event {"type":"delete todo"}`, async () => {
    await executeEvent(sys, { type: 'delete todo' }, { value: 'Single todo' });
  });

  await test.step(`Assert state "Single todo"`, async () => {
    await assertState(sys, { value: 'Single todo' });
  });
});
