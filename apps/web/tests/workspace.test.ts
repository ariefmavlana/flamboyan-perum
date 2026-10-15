import { describe, expect, it } from 'vitest'
import { workspaceNavigation } from '../shared/utils/workspace'
import { staffGuide } from '../shared/content/staff-guide'

describe('workspace navigation and guidance', () => {
  it('limits Marketing navigation and guidance to their responsibilities', () => {
    expect(workspaceNavigation().length).toBe(0)
    const marketing = workspaceNavigation('MARKETING')
    expect(
      marketing.flatMap((group) => group.links).map((link) => link.to),
    ).toEqual([
      '/backoffice',
      '/backoffice/properti',
      '/backoffice/panduan',
      '/backoffice/profil',
    ])
    expect(
      staffGuide('MARKETING').some(
        (topic) => topic.id === 'kpr' || topic.id === 'akun',
      ),
    ).toBe(false)
  })
  it('gives every visible destination a matching help anchor for each role', () => {
    for (const role of ['ADMIN', 'MARKETING'] as const) {
      const chapters = staffGuide(role).map((topic) => topic.id)
      for (const link of workspaceNavigation(role).flatMap(
        (group) => group.links,
      ))
        expect(chapters).toContain(link.guide)
      expect(new Set(chapters).size).toBe(chapters.length)
    }
    expect(staffGuide('ADMIN').map((topic) => topic.id)).toContain('kpr')
  })
})
