import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


DATA_PATH = os.environ.get("DATA_PATH", "./ml/sample_movies.csv")
MODEL_PATH = os.environ.get("MODEL_PATH", "./ml/model.pkl")


def train_content_based_model():
    if not os.path.exists(DATA_PATH):
        # minimal sample data
        df = pd.DataFrame(
            [
                {"movie_id": 1, "title": "Inception", "tags": "sci-fi dream thriller"},
                {"movie_id": 2, "title": "Interstellar", "tags": "space sci-fi drama"},
                {"movie_id": 3, "title": "The Dark Knight", "tags": "superhero crime thriller"},
            ]
        )
    else:
        df = pd.read_csv(DATA_PATH)

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform(df["tags"].fillna(""))
    sim = cosine_similarity(tfidf)

    model = {"vectorizer": vectorizer, "similarity": sim, "movie_ids": df["movie_id"].tolist()}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train_content_based_model()


