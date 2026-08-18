import { getProject } from '@theatre/core'
import state from './sheet/Patterns.theatre-project-state.json'

export const mainSheet = getProject('Patterns', { state }).sheet('Main')

export const studioEnabled = true
