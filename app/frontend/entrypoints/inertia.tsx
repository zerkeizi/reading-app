import { createInertiaApp } from '@inertiajs/react'
import AppLayout from '@/layouts/AppLayout'

void createInertiaApp({
  pages: "../pages",

  // Default persistent layout for every page: header, flash, "+" button and modals
  layout: () => AppLayout,

  // Browser tab title: "<page title> · Reading App", or just the app name when a page sets none
  title: (title) => (title ? `${title} · Catálogo coletivo` : 'Catálogo coletivo'),

  strictMode: true,

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
      withAllErrors: true,
    },
    visitOptions: () => {
      return { queryStringArrayFormat: "brackets" }
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById("app")) {
    throw error
  } else {
    console.error(
      "Missing root element.\n\n" +
      "If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n" +
      'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.',
    )
  }
})
