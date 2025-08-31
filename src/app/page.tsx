"use client";

import { useEffect, useState } from "react";
import type { Item, User } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"

interface Recommendation {
  itemId: string;
  score: number;
}

type Movie = {
  title: string;
  description: string;
  poster: string;
  release_date: string;
  rating: number;
};

export default function Home() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [movies, setMovies] = useState<Record<string, Movie>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(true);


  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users);

      if (data.users.length > 0) {
        setSelectedUser(data.users[0].id);
      }
    };
    fetchUsers();
  }, []);

  // Fetch recommendations + items + movie metadata
  useEffect(() => {
    if (!selectedUser) return;

    const fetchData = async () => {
      setLoading(true);
      toast("Getting recommendations.")

      try {
        const res = await fetch(`/api/recommend/${selectedUser}`);
        const data = await res.json();
        setRecs(data.recommendations);

        // Step 1: fetch items
        const itemRequests = data.recommendations.map(async (rec: Recommendation) => {
          const res1 = await fetch(`/api/items/${rec.itemId}`);
          if (res1.ok) {
            return await res1.json();
          }
          return null;
        });

        const fetchedItems: Item[] = (await Promise.all(itemRequests)).filter(Boolean);
        setItems(fetchedItems);

        // Step 2: fetch movie metadata for each item.title
        const movieRequests = fetchedItems.map(async (item) => {
          const movieRes = await fetch(`/api/movies?title=${encodeURIComponent(item.title)}`);
          if (movieRes.ok) {
            const movieData = await movieRes.json();
            return { id: item.id, movie: movieData };
          }
          return null;
        });

        const fetchedMovies = await Promise.all(movieRequests);
        const movieMap: Record<string, Movie> = {};
        fetchedMovies.forEach((entry) => {
          if (entry) {
            movieMap[entry.id] = entry.movie;
          }
        });
        setMovies(movieMap);
        toast("Finished getting recommendations and movie data.")
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
      finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUser]);

  return (
    <main className="container mx-auto p-8 space-y-8">
      {/* Hero Section */}
      <Card className="p-6 rounded-2xl shadow-lg">
        <div className="grid grid-cols-12 gap-6">
          <section className="space-y-4 col-span-8">
            <h1 className="text-4xl font-bold">🎬 Movie Recommendation System</h1>
            <p className="text-lg text-zinc-600">
              Discover personalized movie recommendations powered by{" "}
              <strong>Collaborative Filtering</strong>. The system leverages{" "}
              <strong>Matrix Factorization</strong> and{" "}
              <strong>Cosine Similarity</strong> to generate high-quality
              recommendations.
            </p>
          </section>
          <section className="col-span-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Hybrid Recommender</CardTitle>
              <CardDescription>
                Select a user to view personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-2">
              <Select value={selectedUser} onValueChange={(value) => setSelectedUser(value)}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </section>
        </div>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
      {loading && 
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg text-zinc-500 w-full">
      
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin h-6 w-6 text-zinc-900" />
          <span className="text-lg">Fetching movie details...</span>
        </div>
    </div>
}

<div>
        <h2 className="text-xl font-semibold mb-2">Recommended Movies</h2>
        {recs.length === 0 || loading ? (
          <p className="text-muted-foreground">No recommendations yet.</p>
        ) : (

          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recs.map((r, idx) => {
              const item = items.find((it) => it.id === r.itemId);
              const movie = item ? movies[item.id] : null;
              return (
                <Card
                  key={r.itemId}
                  className="rounded-2xl shadow-md hover:shadow-lg transition-shadow pt-0"
                >
                  {movie?.poster && (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="rounded-t-2xl w-full h-64 object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle>
                      {idx + 1}. {movie ? movie.title : item?.title || `Item ${r.itemId}`}
                    </CardTitle>
                    <CardDescription>Score: {r.score.toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {movie && (
                      <div className="space-y-2">
                        {/* <p className="text-sm text-gray-700 hidden">{movie.description}</p> */}
                        <p className="text-xs text-gray-500">
                          Release: {movie.release_date} | ⭐ {movie.rating}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
                </div>

    </main>
  );
}
