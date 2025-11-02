import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    'motion.div': any
    'motion.h1': any
    'motion.span': any
    'motion.p': any
  }
}

export {}

