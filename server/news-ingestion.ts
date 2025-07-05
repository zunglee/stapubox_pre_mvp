import { storage } from "./storage";
import { InsertBuzzDigest } from "@shared/schema";

interface StapuBuzzNewsItem {
  sid: number;
  buzz_id: number;
  sname: string;
  title: string;
  summary: string;
  src_name: string;
  src_link: string;
  img_src: string;
  favicon_src: string;
  publish_time: string;
  like_cnt: number | null;
  dislike_cnt: number | null;
  share_cnt: number | null;
  view_cnt: number | null;
  liked: boolean;
  viewed: boolean;
}

interface StapuBuzzResponse {
  status: string;
  msg: string;
  err: any;
  data: {
    buzz_digest: StapuBuzzNewsItem[];
  };
}

class NewsIngestionService {
  private readonly apiUrl = "https://stapubox.com/buzz/digest/api";
  private readonly apiKey = "iMBatman";
  private readonly itemsPerPage = 30;
  private isRunning = false;

  async fetchNewsFromAPI(page: number): Promise<StapuBuzzNewsItem[]> {
    try {
      const url = `${this.apiUrl}?page=${page}&cnt=${this.itemsPerPage}&src_utm=replit&skey=${this.apiKey}`;
      console.log(`📡 Fetching news from API: Page ${page}, URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 API Response Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data: StapuBuzzResponse = await response.json();
      console.log(`📡 API Response:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
      
      if (data.status !== "success") {
        throw new Error(`API returned error: ${data.msg}`);
      }
      
      return data.data.buzz_digest || [];
    } catch (error) {
      console.error(`❌ Error fetching news from API (page ${page}):`, error);
      throw error;
    }
  }

  async saveNewsItem(newsItem: StapuBuzzNewsItem): Promise<boolean> {
    try {
      const buzzData: InsertBuzzDigest = {
        sid: newsItem.sid,
        buzzId: newsItem.buzz_id,
        sname: newsItem.sname,
        title: newsItem.title,
        summary: newsItem.summary,
        srcName: newsItem.src_name,
        srcLink: newsItem.src_link,
        imgSrc: newsItem.img_src || null,
        faviconSrc: newsItem.favicon_src || null,
        publishTime: new Date(newsItem.publish_time),
        likeCnt: newsItem.like_cnt || 0,
        dislikeCnt: newsItem.dislike_cnt || 0,
        shareCnt: newsItem.share_cnt || 0,
        viewCnt: newsItem.view_cnt || 0,
      };

      await storage.createBuzzDigest(buzzData);
      return true;
    } catch (error) {
      // Check if it's a unique constraint violation (duplicate src_link)
      if (error instanceof Error && error.message.includes("duplicate key")) {
        console.log(`🔄 Duplicate news item found: ${newsItem.src_link}`);
        return false; // Signal to stop pagination
      }
      console.error(`❌ Error saving news item:`, error);
      throw error;
    }
  }

  async ingestNews(): Promise<void> {
    console.log("🔄 ingestNews() method called");
    
    if (this.isRunning) {
      console.log("📰 News ingestion already running, skipping...");
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`🚀 Starting news ingestion process at ${startTime.toISOString()}...`);
    
    try {
      let page = 1;
      let totalIngested = 0;
      let duplicateFound = false;
      let errors = [];

      while (!duplicateFound) {
        console.log(`📖 Processing page ${page}...`);
        
        const newsItems = await this.fetchNewsFromAPI(page);
        
        if (newsItems.length === 0) {
          console.log("📭 No more news items found, stopping ingestion");
          break;
        }

        for (const newsItem of newsItems) {
          try {
            const saved = await this.saveNewsItem(newsItem);
            if (!saved) {
              console.log(`🛑 Duplicate found on page ${page}, stopping ingestion`);
              duplicateFound = true;
              break;
            }
            totalIngested++;
            console.log(`✅ Saved: ${newsItem.title.substring(0, 50)}...`);
          } catch (error) {
            console.error(`❌ Failed to save item: ${newsItem.title}`, error);
            errors.push(`${newsItem.title}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        if (!duplicateFound) {
          page++;
          // Add a small delay between requests to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      
      console.log(`🎉 News ingestion completed in ${duration}s. Total new articles: ${totalIngested}`);
      
      if (errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${errors.length}`);
        errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      console.log(`📈 Ingestion Summary: ${totalIngested} new articles added to database`);
    } catch (error) {
      console.error("💥 News ingestion failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  startPeriodicIngestion(): void {
    console.log("⏰ Starting periodic news ingestion (every 2 hours)");
    
    // Run immediately but don't let it crash the app
    this.ingestNews().catch(error => {
      console.error("⚠️ Initial news ingestion failed, but continuing app startup:", error.message);
    });
    
    // Then run every 2 hours (2 * 60 * 60 * 1000 ms)
    setInterval(() => {
      this.ingestNews().catch(error => {
        console.error("⚠️ Periodic news ingestion failed:", error.message);
      });
    }, 2 * 60 * 60 * 1000);
  }

  // Manual trigger for testing
  async manualIngest(): Promise<void> {
    await this.ingestNews();
  }
}

export const newsIngestionService = new NewsIngestionService();