import express from "express";
import {
  resisterView,
  createComment,
  deleteComment,
} from "../controllers/videoControllers";

const apiRouter = express.Router();

apiRouter.post("/videos/:id([0-9a-f]{24})/view", resisterView);
apiRouter.post("/videos/:id([0-9a-f]{24})/comment", createComment);
apiRouter.delete("/comments/:id/delete", deleteComment);
export default apiRouter;
