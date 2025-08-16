# Sistema de Gestión de Pedidos - Frontend

Sistema web para gestión de pedidos de imprenta desarrollado con React + TypeScript.

## 🚀 Características

- **Gestión de Pedidos**: Crear, buscar, listar y actualizar pedidos
- **Códigos QR**: Generación automática de códigos QR para pedidos
- **Gestión de Catálogos**: Productos, materiales, servicios y clientes
- **Estados de Pedidos**: Flujo completo desde creación hasta entrega
- **Interfaz Responsive**: Diseño adaptable con Bootstrap

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Bootstrap 5 + Bootstrap Icons
- **Build Tool**: Vite
- **API**: REST API con autenticación por cookies

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Backend API ejecutándose en `http://localhost:3000`

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/PG2-Frontend.git
   cd PG2-Frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 🏗️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter
```

## 📁 Estructura del Proyecto

```
src/
├── api/             # Funciones de API
│   ├── auth.ts
│   ├── clients.ts
│   ├── material.ts
│   ├── products.ts
│   ├── quote.ts
│   └── services.ts
├── components/      # Componentes reutilizables
├── pages/          # Páginas principales
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── QuoteAdmin.tsx
│   └── ...
├── App.tsx
└── main.tsx
```

## 🔐 Autenticación

El sistema utiliza autenticación basada en cookies. Las credenciales se manejan automáticamente en las peticiones HTTP.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [Mynor454-s](https://github.com/Mynor454-s)
- Email: tu.email@ejemplo.com