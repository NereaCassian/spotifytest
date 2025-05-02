import { NextRequest, NextResponse } from "next/server";

// Este endpoint simplemente sirve como un mecanismo de caché
// La idea es que el endpoint principal de recomendaciones guarde sus resultados 
// usando este endpoint y luego los recupere cuando sea necesario

// Almacenamiento en memoria para las recomendaciones durante la sesión
// En un entorno de producción real, usarías una base de datos persistente
const recommendationsCache = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  
  if (recommendationsCache.has(key)) {
    return NextResponse.json(recommendationsCache.get(key));
  }
  
  return new NextResponse(null, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const data = await request.json();
  
  recommendationsCache.set(key, data);
  
  return NextResponse.json({ success: true });
} 