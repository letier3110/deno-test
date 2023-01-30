import { serve } from "https://deno.land/std@0.155.0/http/server.ts";

// import { NewsPath } from './env'

const HTML_ROUTE = new URLPattern({ pathname: "/html" });
const ROOT_ROUTE = new URLPattern({ pathname: "/" });
const REFRESH_ROUTE = new URLPattern({ pathname: "/refresh" });

const NewsPath = 'https://hacker-news.firebaseio.com/v0'

interface Story {
  title: string
  url: string
}

let buf: Array<Story> = []

const refresh = async () => {
  buf = []
  const count = 3

  const response = await fetch(`${NewsPath}/topstories.json`)
  const ids = await response.json()

  const promises = [] as Promise<Response>[]
  for (let idx = 0; idx < count; idx++) {
    promises.push(fetch(`${NewsPath}/item/${ids[idx]}.json`))
  }

  const responses = await Promise.all(promises)
  const stories = await Promise.all(
    responses.map(it => it.json() as Promise<Story>)
  )

  stories.forEach(it => {
    console.log(`\n${it.title}`)
    buf.push(it)
  })
}

const insertInHtml = (str: string) => `<html><head></head><body>${str}</body></html>`

const mapStoryToHtml = (story: Array<Story>) => {
  return story.map(x => {
    return `<div>
      <a href="${x.url}">${x.title}</a>
    </div>`
  });
}

const handler = (req: Request): Response => {
  const rootMatch = ROOT_ROUTE.exec(req.url);
  const refreshMatch = REFRESH_ROUTE.exec(req.url);
  const htmlMatch = HTML_ROUTE.exec(req.url);
  if (rootMatch) {
    return new Response(buf.map(x => JSON.stringify(x)).toString());
  }
  if (refreshMatch) {
    refresh()
    return new Response("ok");
  }
  if (htmlMatch) {
    // const id = match.pathname.groups.id;
    return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
        "content-type": "text/html; charset=utf-8",
      }});
  }
  return new Response("Not found (try /)", {
    status: 404,
  });
}
serve(handler)
// serve((req: Request) => new Response(buf.toString()));