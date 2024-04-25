import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import OpenLayerTest from '../views/OpenLayerTest.vue'
import Vue3OpenlayerTest from '../views/Vue3OpenlayerTest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
    ,
    {
      path: '/OpenLayerTest',
      name: 'OpenLayerTest',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: OpenLayerTest
    }
    ,
    {
      path: '/Vue3OpenlayerTest',
      name: 'Vue3OpenlayerTest',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: Vue3OpenlayerTest
    }
  ]
})

export default router
