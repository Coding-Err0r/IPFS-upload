function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function sleep(fn, ...args) {
  await timeout(3000);
  return fn(...args);
}

sleep(() => {
  console.log('hello');
}, 'world');

