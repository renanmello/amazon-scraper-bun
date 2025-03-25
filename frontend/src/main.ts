const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
const keywordInput = document.getElementById('keyword') as HTMLInputElement;
const productsGrid = document.getElementById('products-grid') as HTMLDivElement;
const loader = document.getElementById('loader') as HTMLDivElement;

searchBtn.addEventListener('click', async () => {
  const keyword = keywordInput.value.trim();
  
  if (!keyword) {
    alert('Please enter a search term');
    return;
  }

  try {
    loader.classList.remove('hidden');
    productsGrid.innerHTML = '';
    
    const response = await fetch(`http://localhost:3000/api/scrape?keyword=${encodeURIComponent(keyword)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    productsGrid.innerHTML = `<p class="error-message">${errorMessage}</p>`;
  } finally {
    loader.classList.add('hidden');
  }
});

function displayProducts(products: any[]) {
  productsGrid.innerHTML = '';
  
  if (products.length === 0) {
    productsGrid.innerHTML = '<p class="no-results">No products found</p>';
    return;
  }

  products.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    const imageUrl = product.image !== 'N/A' ? product.image : 
                   'https://via.placeholder.com/200?text=Imagem+Não+Disponível';
    
    const titleDisplay = product.title !== 'N/A' ? product.title : 'Untitled product';
    const priceDisplay = product.price !== 'N/A' ? product.price : 'Price unavailable';
    
    
    let ratingDisplay = '<div class="no-rating">No reviews</div>';
    if (product.rating !== 'N/A') {
      const numericRating = parseFloat(product.rating.replace(',', '.')); 
      const fullStars = Math.floor(numericRating);
      const hasHalfStar = numericRating % 1 >= 0.5;
      
      ratingDisplay = `
        <div class="product-rating">
          <span class="stars">
            ${'★'.repeat(fullStars)}
            ${hasHalfStar ? '½' : ''}
            ${'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
          </span>
          <span class="rating-value">${product.rating}</span>
          ${product.reviews !== '0' ? `<span class="reviews">(${product.reviews})</span>` : ''}
        </div>
      `;
    }
    
    productCard.innerHTML = `
      <img src="${imageUrl}" alt="${titleDisplay}" class="product-image">
      <div class="product-info">
        <h3 class="product-title">${titleDisplay}</h3>
        <div class="product-meta">
          ${ratingDisplay}
          <div class="product-price">${priceDisplay}</div>
        </div>
        <a href="${product.link}" target="_blank" class="product-link">View on Amazon</a>
      </div>
    `;
    
    productsGrid.appendChild(productCard);
  });
}

