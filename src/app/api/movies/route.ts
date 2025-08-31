import { NextResponse } from "next/server";

const API_KEY = process.env.TMDB_API_KEY as string;
const BASE_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    // Search for the movie by title
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        title
      )}`
    );

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Return the first match
    const movie = data.results[0];
    return NextResponse.json({
      title: movie.title,
      description: movie.overview,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      release_date: movie.release_date,
      rating: movie.vote_average,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch movie" }, { status: 500 });
  }
}
