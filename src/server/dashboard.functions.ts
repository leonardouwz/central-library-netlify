import { createServerFn } from '@tanstack/react-start'
import { run, services } from './container.server'

export const getOverview = createServerFn({ method: 'GET' }).handler(() => run(() => services.dashboard.overview()))
