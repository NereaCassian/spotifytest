import NextAuth from "next-auth/next";
import { authOptions } from "./auth";

// Crear una instancia del handler usando la configuración
const handler = NextAuth(authOptions);

// Exportar solo los métodos GET y POST
export { handler as GET, handler as POST }; 