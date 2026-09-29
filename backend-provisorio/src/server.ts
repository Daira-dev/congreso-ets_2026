import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { pool } from "./lib/db";
import authRoutes from "./routes/auth.routes";
import registroRoutes from "./routes/registro.routes";
import { authenticateOperator } from "./middlewares/authMiddleware";
import actividadesRoutes from "./routes/actividades.routes";
import { adminActividadesRouter } from "./routes/actividades.routes";
import inscriptosRoutes from "./routes/inscriptos.routes";
import credencialRoutes from "./routes/credencial.routes";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(authenticateOperator);
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/actividades", adminActividadesRouter);
app.use("/api/admin/inscriptos", inscriptosRoutes);
app.use("/api/admin/usuarios", inscriptosRoutes);

app.use("/api/registro", registroRoutes);

app.use("/api/actividades", actividadesRoutes);
app.use("/api/credencial", credencialRoutes);


app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS ahora");

    res.json({
      ok: true,
      message: "Backend provisional funcionando",
      database: "congresoets_dbprovisoria",
      hora_servidor: result.rows[0].ahora,
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    res.status(500).json({
      ok: false,
      message: "Backend funcionando, pero PostgreSQL no responde.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend provisional: http://localhost:${PORT}`);
});