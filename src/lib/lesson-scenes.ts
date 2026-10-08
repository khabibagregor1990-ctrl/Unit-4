import shops from "@/assets/quest-shops.jpg";
import interview from "@/assets/quest-shopping-talk.jpg";
import manchester from "@/assets/quest-manchester.jpg";
import housework from "@/assets/quest-housework.jpg";

export type LessonScene = {
  image: string;
  alt: string;
  quest: string;
  mission: string;
};

export function lessonScene(title: string, kind: string): LessonScene {
  const name = title.toLowerCase();
  if (name.includes("revise")) {
    return {
      image: manchester,
      alt: "Manchester streets at dusk",
      quest: "The boss challenge",
      mission: "Use everything you've learned to beat the final challenge.",
    };
  }
  if (name.includes("housework") || name.includes("yet, just")) {
    return {
      image: housework,
      alt: "People tidying a home together",
      quest: "The house mission",
      mission: "Find the clues hidden around the house.",
    };
  }
  if (name.includes("weekendvy") || name.includes("something, anything")) {
    return {
      image: manchester,
      alt: "City streets at the weekend",
      quest: "The weekend secret",
      mission: "Find out what people really do at the weekend.",
    };
  }
  if (name.includes("new words")) {
    return {
      image: interview,
      alt: "People chatting on a busy street",
      quest: "The word hunters",
      mission: "Track down where new English words come from.",
    };
  }
  if (name.includes("send it back")) {
    return {
      image: shops,
      alt: "Shoppers on a British high street",
      quest: "The returns mystery",
      mission: "Discover what really happens to the clothes we send back.",
    };
  }
  if (name.includes("weekend") || name.includes("manchester")) {
    return {
      image: manchester,
      alt: "Manchester canal, historic mills and city streets",
      quest: "The weekend mystery",
      mission: "Follow the clues through Manchester's story.",
    };
  }
  if (kind === "audio" || name.includes("interview")) {
    return {
      image: interview,
      alt: "A shopper being interviewed on a busy high street",
      quest: "The shopping trail",
      mission: "Listen closely and collect clues from the conversation.",
    };
  }
  if (kind === "reading") {
    return {
      image: shops,
      alt: "Shoppers walking past shops on a British high street",
      quest: "The high street trail",
      mission: "Read the story and uncover what happens on the high street.",
    };
  }
  return {
    image: shops,
    alt: "Shoppers walking past shops on a British high street",
    quest: "The shop detective",
    mission: "Watch carefully and uncover the story behind the shops.",
  };
}
