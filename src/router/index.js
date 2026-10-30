import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/",
    name: "shop",
    component: () => import("@/views/ShopView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        redirect: { name: "dashboard" },
      },
      {
        path: "inicio",
        name: "dashboard",
        component: () => import("@/views/admin/DashboardView.vue"),
      },
      {
        path: "productos",
        name: "products",
        component: () => import("@/views/admin/ProductsView.vue"),
      },
      {
        path: "productos/nuevo",
        name: "products-new",
        component: () => import("@/views/admin/NewProductView.vue"),
      },
      {
        path: "productos/editar/:id",
        name: "products-edit",
        component: () => import("@/views/admin/EditProductView.vue"),
      },
      {
        path: "ventas",
        name: "sales",
        component: () => import("@/views/admin/SalesView.vue"),
      },
    ],
  },
  {
    path: "/403",
    name: "forbidden",
    component: () => import("@/views/ForbiddenView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // The first navigation waits for Firebase to restore the persisted session.
  await authStore.init();

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.isAdmin ? { name: "dashboard" } : { name: "shop" };
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
