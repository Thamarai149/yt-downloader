import React from 'react'
import { createRoot } from 'react-dom/client'
import AppEnhanced from './AppEnhanced'
import './index.css'
import './modern-styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('Failed to find the root element')

const root = createRoot(container)

root.render(
  <React.StrictMode>
    <AppEnhanced />
  </React.StrictMode>
)