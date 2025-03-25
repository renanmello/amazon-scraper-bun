import { serve } from 'bun';
import axios from 'axios';
import { JSDOM } from 'jsdom';

//cors configuration
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  

// Types for our product data
interface AmazonProduct {
    title: string;
    rating: string;
    reviews: string;
    image: string;
    price: string;
    link: string;
  }

// Scrape Amazon Brazil search results
async function scrapeAmazon(keyword: string): Promise<AmazonProduct[]> {
    try {
      const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(keyword)}`;
      
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
  
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const products: AmazonProduct[] = [];
      
      
      document.querySelectorAll('.s-result-item').forEach((item) => {
        // extracting information from items:titles,images,...
        const titleElement = item.querySelector('h2 a span') || 
                           item.querySelector('.a-size-mini a span') ||
                           item.querySelector('.a-size-base-plus.a-color-base.a-text-normal') ||
                           item.querySelector('.a-text-normal .a-size-base-plus');
        
        const title = titleElement?.textContent?.trim() || 'N/A';
  
        
        const ratingElement = item.querySelector('.a-icon-star-small .a-icon-alt') || 
                            item.querySelector('.a-icon-alt');
        const rating = ratingElement?.textContent?.split(' ')[0] || 'N/A';
  
        
        const reviewsElement = item.querySelector('.a-size-small .a-color-base') ||
                             item.querySelector('.a-size-base.s-underline-text');
        const reviews = reviewsElement?.textContent?.trim().replace(/[^\d]/g, '') || '0';
  
        
        const imageElement = item.querySelector('.s-image') ||
                           item.querySelector('img.s-latency-cf-element');
        const image = imageElement?.getAttribute('src') || 'N/A';
  
        
        const priceElement = item.querySelector('.a-price .a-offscreen') ||
                           item.querySelector('.a-price-whole');
        const price = priceElement?.textContent?.trim() || 'N/A';
  
        
        const linkElement = item.querySelector('h2 a') || 
                          item.querySelector('.a-link-normal.a-text-normal');
        const link = linkElement?.getAttribute('href') 
          ? `https://www.amazon.com.br${linkElement.getAttribute('href')}` 
          : '#';
  
        // Filters invalid products
        if (title !== 'N/A' || price !== 'N/A') {
          products.push({ title, rating, reviews, image, price, link });
        }
      });
  
      return products;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  //server configuration
serve({
  port: 3000,
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    if (url.pathname === '/api/scrape') {
      const keyword = url.searchParams.get('keyword');
      
      if (!keyword) {
        return new Response(JSON.stringify({ error: 'Missing keyword parameter' }), {
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        });
      }

      try {
        const products = await scrapeAmazon(keyword);
        return new Response(JSON.stringify(products), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to scrape Amazon',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        });
      }
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        const frontendResponse = await fetch(`http://localhost:5173${url.pathname}`);
        const response = new Response(frontendResponse.body, frontendResponse);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      } catch (e) {
        return new Response('Frontend not available', { status: 502 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
});

console.log(`Server running at http://localhost:3000`);