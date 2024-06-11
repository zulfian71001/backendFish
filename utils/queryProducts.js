class QueryProducts {
    constructor(products, query) {
      this.products = products;
      this.query = query;
    }
  
    categoryQuery() {
      if (this.query.category) {
        this.products = this.products.filter(product => product.categoryName === this.query.category);
      
      }
      return this;
    }

    searchProduct(){
      if(this.query.searchValue){
        this.products = this.products.filter(product => product.name.toLowerCase().includes(this.query.searchValue.toLowerCase()))
      } else {
        this.products 
      }
      console.log(this.products)
      return this
    }
  
    ratingQuery() {
      if (this.query.rating == 0) {
        this.products 
    } else {
          this.products = this.products.filter(product => parseInt(this.query.rating) <= product.ratings && product.ratings < parseInt(this.query.rating) + 1);

      }
      return this;
    }
  
    sortByPrice() {
      if (this.query.sortPrice) {
        if (this.query.sortPrice === "Low-to-High") {
          this.products = this.products.sort((a, b) => a.price - b.price);
        } else {
          this.products = this.products.sort((a, b) => b.price - a.price);
        }
      }
      return this;
    }
  
    skip() {
      const { pageNumber, perPage } = this.query;
      if (pageNumber && perPage) {
        const skipPage = (parseInt(pageNumber) - 1) * parseInt(perPage);
        this.products = this.products.slice(skipPage);
      }
      return this;
    }
  
    limit() {
      const { perPage } = this.query;
      if (perPage) {
        this.products = this.products.slice(0, parseInt(perPage));
      }
      return this;
    }
  
    getProducts() {
      return this.products;
    }
  
    countProducts() {
      return this.products.length;
    }
  }
  
  module.exports = QueryProducts;
  