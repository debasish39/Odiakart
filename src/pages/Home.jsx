import React from "react";

import Carousel from "../components/Carousel";
import RecentlyViewed from "../components/RecentlyViewed";
import BestSellerProducts from "../components/BestSellerrProducts";
import PopulartProducts from "../components/PopulartProducts";
import TopRatedProducts from "../components/TopRatedProducts";
import FeaturedProducts from "../components/FeaturedProducts";
import NewArrivalProducts from "../components/NewArrivalProducts";
import Category from "../components/Category";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-gray-800 duration-500">

      {/* Category */}
      <section>
        <Category />
      </section>

      {/* Hero / Carousel */}
      <section>
        <Carousel />
      </section>

      {/* Recently Viewed */}
      <section>
        <RecentlyViewed />
      </section>

      {/* Best Sellers */}
      <section>
        <BestSellerProducts />
      </section>

      {/* Popular Products */}
      <section>
        <PopulartProducts />
      </section>

      {/* Top Rated */}
      <section>
        <TopRatedProducts />
      </section>

      {/* Featured Products */}
      <section>
        <FeaturedProducts />
      </section>

      {/* New Arrivals */}
      <section>
        <NewArrivalProducts />
      </section>

    </main>
  );
}