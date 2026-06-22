import "./env";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`DefectLens API listening on http://localhost:${port}`);
});
