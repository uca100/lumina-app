export const ITEM_TYPES = ['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit'] as const
export type ItemType = typeof ITEM_TYPES[number]
