"use client"

import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useState } from 'react'
import NavBar from './ui/tubelight-navbar'
import { 
  HomeIcon, 
  MenuIcon, 
  OrderIcon, 
  RestaurantLocationIcon, 
  LoginIcon, 
  ProfileIcon, 
  LogoutIcon,
  ReservationIcon,
  CartIcon
} from './icons/CustomIcons'
import CartSidebar from './CartSidebar'

export function MainNav() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const toggleCart = () => {
    setCartOpen(!cartOpen)
  }

  const navigationItems = [
    {
      href: '/',
      icon: HomeIcon,
      label: 'Home',
      description: 'Ir al inicio'
    },
    {
      href: '/menu',
      icon: MenuIcon,
      label: 'Menu',
      description: 'Ver nuestro menú'
    },
    {
      href: '/reservations',
      icon: ReservationIcon,
      label: 'Reservas',
      description: 'Reservar mesa'
    },
    {
      href: '/contact',
      icon: RestaurantLocationIcon,
      label: 'Contact',
      description: 'Contacto y ubicación'
    },
    // Cart button (always visible now)
    {
      onClick: toggleCart,
      icon: CartIcon,
      label: `Carrito${totalItems > 0 ? ` (${totalItems})` : ''}`,
      description: 'Ver carrito de compras',
      badge: totalItems > 0 ? totalItems : null
    },
    // Authentication items
    ...(user ? [
      {
        href: '/profile',
        icon: ProfileIcon,
        label: 'Profile',
        description: 'Mi perfil'
      },
      {
        onClick: handleLogout,
        icon: LogoutIcon,
        label: 'Logout',
        description: 'Cerrar sesión'
      }
    ] : [
      {
        href: '/login',
        icon: LoginIcon,
        label: 'Login',
        description: 'Iniciar sesión'
      }
    ])
  ]

  return (
    <>
      <NavBar 
        items={navigationItems} 
        currentPath={router.pathname}
      />
      
      {/* Cart Sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
} 