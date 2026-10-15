import { describe, expect, it } from 'vitest'
import { youtubeEmbed } from '../shared/utils/youtube'

describe('Published YouTube source', () => {
  it('preserves the approved start time and signed video ID', () => {
    expect(
      youtubeEmbed(
        'https://www.youtube-nocookie.com/embed/-0al2pEnNDk?start=10',
      ),
    ).toEqual({ id: '-0al2pEnNDk', start: 10 })
    expect(
      youtubeEmbed('https://www.youtube-nocookie.com/embed/-0al2pEnNDk'),
    ).toEqual({ id: '-0al2pEnNDk', start: 0 })
  })
  it('rejects unapproved origins and invalid times instead of loading an external frame', () => {
    for (const value of [
      null,
      'invalid',
      'https://www.youtube-nocookie.com.evil.test/embed/-0al2pEnNDk',
      'https://www.youtube-nocookie.com/embed/short',
      'https://www.youtube-nocookie.com/embed/-0al2pEnNDk?start=-1',
      'https://www.youtube-nocookie.com/embed/-0al2pEnNDk?start=1.5',
      'https://www.youtube-nocookie.com/embed/-0al2pEnNDk?start=86401',
    ])
      expect(youtubeEmbed(value)).toBeNull()
  })
})
