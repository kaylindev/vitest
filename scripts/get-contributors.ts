import { promises as fs } from 'fs'
import fetch from 'node-fetch'

const { GITHUB_TOKEN: token } = process.env

async function fetchContributors() {
  const collaborators: string[] = []
  const res = await fetch('https://api.github.com/repos/antfu-sponsors/vitest/contributors', {
    method: 'get',
    headers: {
      'authorization': `bearer ${token}`,
      'content-type': 'application/json',
    },
  })
  const data: any = await res.json()
  collaborators.push(...data.map((i: any) => i.login))
  return collaborators
}

async function generate() {
  const collaborators = await fetchContributors()
  await fs.writeFile('./docs/contributors.json', JSON.stringify(collaborators, null, 2), 'utf8')
}

generate()
