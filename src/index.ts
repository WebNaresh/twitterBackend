import { intializeServer } from "./app";

async function init() {
  const app = await intializeServer();
  app.listen(8000, () => console.log(`Server Started at PORT : 8000`));
}
init();
