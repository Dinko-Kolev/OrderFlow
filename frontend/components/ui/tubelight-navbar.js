"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '../../lib/utils'

const NavBar = ({ items = [], currentPath = '' }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Update active index when currentPath changes
  useEffect(() => {
    const activeItem = items.findIndex(item => item.href === currentPath)
    if (activeItem !== -1) {
      setActiveIndex(activeItem)
    }
  }, [currentPath, items])

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  }

  const renderNavItem = (item, index) => {
    const isActive = activeIndex === index
    const isHovered = hoveredIndex === index
    const IconComponent = item.icon

    const baseClasses = cn(
      "relative cursor-pointer text-sm font-semibold px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-300 flex items-center gap-1.5 md:gap-2.5 hover:scale-105 transform active:scale-95 z-[9999]",
      isActive
        ? "bg-gradient-to-r from-primary to-red-500 text-white shadow-lg shadow-primary/25"
        : "text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-red-500/5"
    )

    const content = (
      <>
        <div className="relative">
          <IconComponent 
            size={20} 
            strokeWidth={isActive ? 2.8 : 2.2} 
            className="transition-all duration-300 drop-shadow-sm filter brightness-110 flex-shrink-0 w-6 h-6 md:w-5 md:h-5" 
          />
          {/* Badge for cart */}
          {item.badge && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
              {item.badge}
            </span>
          )}
        </div>
        <span className="hidden md:inline transition-all duration-300 whitespace-nowrap font-bold text-shadow-sm text-sm">
          {item.label}
        </span>
        
        {/* Active indicator - tubelight effect */}
        {isActive && (
          <div className="absolute inset-0 w-full bg-gradient-to-r from-primary/20 to-red-500/20 rounded-xl -z-10">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 md:w-10 h-1 bg-gradient-to-r from-primary to-red-500 rounded-t-full opacity-90">
              <div className="absolute w-12 md:w-14 h-3 bg-gradient-to-r from-primary/40 to-red-500/40 rounded-full blur-sm -top-0.5 -left-2"></div>
              <div className="absolute w-8 md:w-10 h-2 bg-gradient-to-r from-primary/50 to-red-500/50 rounded-full blur-sm -top-0.5"></div>
              <div className="absolute w-4 md:w-6 h-1 bg-gradient-to-r from-primary/60 to-red-500/60 rounded-full blur-sm top-0 left-1 md:left-2"></div>
            </div>
          </div>
        )}
        
        {/* Tooltip */}
        {isHovered && item.description && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="hidden md:block absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none"
          >
            {item.description}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </motion.div>
        )}
      </>
    )

    const handleClick = () => {
      if (item.onClick) {
        item.onClick()
      } else if (item.href) {
        setActiveIndex(index)
      }
    }

    return (
      <motion.div
        key={item.href || item.label}
        variants={itemVariants}
        className="relative group"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {item.onClick ? (
          <button
            onClick={handleClick}
            className={baseClasses}
          >
            {content}
          </button>
        ) : (
          <Link
            href={item.href}
            className={baseClasses}
            onClick={handleClick}
          >
            {content}
          </Link>
        )}
      </motion.div>
    )
  }

  return (
    <div className="fixed bottom-0 sm:top-0 left-0 right-0 z-[9999] mb-4 sm:mb-0 sm:pt-6 flex justify-center pointer-events-none">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="h-[120px] md:h-[150px] pointer-events-auto"
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center gap-0.5 md:gap-1 bg-white/95 border border-gray-200/60 backdrop-blur-xl py-1.5 md:py-2 px-1.5 md:px-2 rounded-xl md:rounded-2xl shadow-2xl ring-1 ring-black/5 relative z-[9999]">
          {items.map((item, index) => renderNavItem(item, index))}
        </div>
      </motion.div>
    </div>
  )
}

export default NavBar 