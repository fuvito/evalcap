import { fetcher } from '@/lib/fetcher'

afterEach(() => jest.restoreAllMocks())

describe('fetcher', () => {
  it('returns parsed JSON for ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ value: 42 }),
    } as Response)
    const result = await fetcher('/api/test')
    expect(result).toEqual({ value: 42 })
    expect(fetch).toHaveBeenCalledWith('/api/test')
  })

  it('throws with status code on non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)
    await expect(fetcher('/api/missing')).rejects.toThrow('404')
  })

  it('throws with 500 on server error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)
    await expect(fetcher('/api/broken')).rejects.toThrow('500')
  })
})
