import type { Context } from '@/context.ts'
import type { MoveResourceType } from '@/types.ts'
import { expect } from 'vitest'

// eslint-disable-next-line ts/explicit-function-return-type
export function checkResource(ctx: Context, name: string, obj: MoveResourceType) {
    expect(ctx.resolveResources(name)).toMatchObject(obj)
}
