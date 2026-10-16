import React from "react";

import Carousel from "../components/Carousel";
import Category from "../components/Category";
import PopulartProducts from "../components/PopulartProducts";
import RecentlyViewed from "../components/RecentlyViewed";
import BestSellerProducts from "../components/BestSellerrProducts";
import TopRatedProducts from "../components/TopRatedProducts";
import FeaturedProducts from "../components/FeaturedProducts";
import NewArrivalProducts from "../components/NewArrivalProducts";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F9FC] text-slate-900">
      <div className="mx-auto w-full max-w-7xl ">
        {/* Hero banner */}
        <section >
          <Carousel />
        </section>

        {/* Compact category grid */}
        <section className="mt-1">
          <Category />
        </section>

        {/* Trending product cards */}
        <section className="mt-2 sm:mt-5">
          <PopulartProducts />
        </section>

        <section className="mt-5 sm:mt-8">
          <RecentlyViewed />
        </section>

        <section className="mt-5 sm:mt-8">
          <BestSellerProducts />
        </section>

        <section className="mt-5 sm:mt-8">
          <TopRatedProducts />
        </section>

        <section className="mt-5 sm:mt-8">
          <FeaturedProducts />
        </section>

        <section className="mt-5 sm:mt-8">
          <NewArrivalProducts />
        </section>
      </div>
    </main>
  );
}
