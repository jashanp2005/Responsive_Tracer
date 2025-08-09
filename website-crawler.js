import puppeteer from "puppeteer";
import { URL } from "url";

class WebsiteCrawler {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 20;
    this.maxDepth = options.maxDepth || 3;
    this.visitedUrls = new Set();
    this.discoveredUrls = new Set();
    this.pageData = new Map();
    this.apiCalls = [];
  }

  async crawlWebsite(baseUrl) {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
      headless: "new",
    });

    try {
      const crawlQueue = [{ url: baseUrl, depth: 0, parentUrl: null }];

      while (crawlQueue.length > 0 && this.visitedUrls.size < this.maxPages) {
        const { url: currentUrl, depth, parentUrl } = crawlQueue.shift();

        if (this.visitedUrls.has(currentUrl) || depth > this.maxDepth) {
          continue;
        }

        console.log(`Crawling: ${currentUrl} (depth: ${depth})`);
        this.visitedUrls.add(currentUrl);

        const page = await browser.newPage();

        try {
          await page.setRequestInterception(true);

          const apiCallsForPage = [];

          page.on("request", (request) => {
            const isApiCall = this.isApiRequest(
              request.url(),
              request.resourceType()
            );

            if (isApiCall) {
              const apiCall = {
                id: this.generateUniqueId(),
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                resourceType: request.resourceType(),
                startTime: Date.now(),
                page: currentUrl,
                depth: depth,
              };

              apiCallsForPage.push(apiCall);
            }

            request.continue();
          });

          page.on("response", async (response) => {
            const request = response.request();
            const isApiCall = this.isApiRequest(
              request.url(),
              request.resourceType()
            );

            if (isApiCall) {
              const apiCall = apiCallsForPage.find(
                (call) =>
                  call.url === request.url() &&
                  call.method === request.method()
              );

              if (apiCall) {
                apiCall.endTime = Date.now();
                apiCall.duration = apiCall.endTime - apiCall.startTime;
                apiCall.status = response.status();
                apiCall.statusText = response.statusText();
                apiCall.responseHeaders = response.headers();
                apiCall.responseSize = response.headers()["content-length"] || 0;
              }
            }
          });

          await page.goto(currentUrl, {
            waitUntil: ["networkidle0", "domcontentloaded"],
            timeout: 30000,
          });

          const pageInfo = await page.evaluate((baseUrl) => {
            const anchorElements = Array.from(document.querySelectorAll("a[href]"));
            const baseHost = new URL(baseUrl).host;

            const links = anchorElements
              .map((anchor) => {
                try {
                  const href = anchor.getAttribute("href");
                  if (!href) return null;

                  const absoluteUrl = new URL(href, baseUrl);

                  if (absoluteUrl.host === baseHost) {
                    return {
                      url: absoluteUrl.href,
                      text: anchor.textContent?.trim() || "",
                      title: anchor.title || "",
                    };
                  }
                  return null;
                } catch (e) {
                  return null;
                }
              })
              .filter((link) => link !== null);

            return {
              links,
              title: document.title,
              description:
                document.querySelector('meta[name="description"]')?.content || "",
              h1Count: document.querySelectorAll("h1").length,
              imageCount: document.querySelectorAll("img").length,
              scriptCount: document.querySelectorAll("script").length,
            };
          }, baseUrl);

          this.pageData.set(currentUrl, {
            ...pageInfo,
            linkCount: pageInfo.links.length,
            depth,
            parentUrl,
            apiCalls: apiCallsForPage.length,
          });

          this.apiCalls.push(...apiCallsForPage);

          pageInfo.links.forEach((link) => {
            if (
              !this.visitedUrls.has(link.url) &&
              !this.discoveredUrls.has(link.url)
            ) {
              this.discoveredUrls.add(link.url);
              crawlQueue.push({
                url: link.url,
                depth: depth + 1,
                parentUrl: currentUrl,
              });
            }
          });

          await this.simulateUserInteractions(page);
        } catch (error) {
          console.error(`Error crawling ${currentUrl}: ${error.message}`);
          this.pageData.set(currentUrl, {
            error: error.message,
            depth,
            parentUrl,
          });
        } finally {
          await page.close();
        }
      }

      return this.generateCrawlResults();
    } finally {
      await browser.close();
    }
  }

  async simulateUserInteractions(page) {
    try {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(1000);

      const clickableElements = await page.$$(
        "button, [role='button'], .btn"
      );
      for (let i = 0; i < Math.min(clickableElements.length, 3); i++) {
        try {
          await clickableElements[i].click();
          await page.waitForTimeout(500);
        } catch (e) {}
      }
    } catch (error) {
      console.log("Error during user interaction simulation:", error.message);
    }
  }

  isApiRequest(url, resourceType) {
    const apiPatterns = [
      /\/api\//i,
      /\/graphql/i,
      /\/rest\//i,
      /\/v\d+\//i,
      /\.json$/i,
    ];

    const isXhrOrFetch = resourceType === "xhr" || resourceType === "fetch";
    const matchesPattern = apiPatterns.some((pattern) => pattern.test(url));

    return isXhrOrFetch || matchesPattern;
  }

  generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  generateCrawlResults() {
    return {
      visitedUrls: Array.from(this.visitedUrls),
      pageData: Object.fromEntries(this.pageData),
      totalPages: this.visitedUrls.size,
      totalApiCalls: this.apiCalls.length,
      apiCalls: this.apiCalls,
      maxDepthReached: Math.max(
        ...Array.from(this.pageData.values()).map((p) => p.depth || 0)
      ),
    };
  }
}

export { WebsiteCrawler };
