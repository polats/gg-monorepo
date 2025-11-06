import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{
        backgroundImage: `url(/minigame-assets/zoom-background.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="text-white hover:text-black">
            ← Back
          </Button>
        </div>
        <h1 className="text-5xl text-center text-white mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Help Center
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works">
              <AccordionTrigger className="text-left text-lg text-black">
                How does this actually work?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  Diamond Hands is a game where you deposit WLD tokens and receive a virtual diamond that changes in value over time.
                </p>
                <p>
                  Every 5 seconds, your diamond's price updates based on market volatility (ranging from -4% to +7%). You must tap the diamond at least once per price update to continue holding it, or you'll automatically sell.
                </p>
                <p>
                  The goal is to hold on as long as possible and sell at the right moment to maximize your profits!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="world-id">
              <AccordionTrigger className="text-left text-lg text-black">
                What is World ID and why do I need it?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  World ID is a privacy-preserving identity protocol that ensures you're a real person without revealing your personal information.
                </p>
                <p>
                  We use World ID to authenticate your wallet and prevent bot abuse while keeping your identity completely private. This ensures fair gameplay for all users.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing">
              <AccordionTrigger className="text-left text-lg text-black">
                How is the diamond price calculated?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  Your diamond starts at the exact value of your WLD deposit. Every 5 seconds, the price changes by a random percentage between -4% and +7%.
                </p>
                <p>
                  This volatility system is designed with a slight upward bias (more chance of gains than losses), but there's always risk involved. The longer you hold, the more potential for both gains and losses.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gameplay">
              <AccordionTrigger className="text-left text-lg text-black">
                What happens if I don't tap in time?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  If you don't tap your diamond within 5 seconds of a price update, you automatically sell at the current price.
                </p>
                <p>
                  This means you need to stay engaged and actively decide whether to hold or let go. There's no pause button - the market keeps moving whether you're ready or not!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="strategy">
              <AccordionTrigger className="text-left text-lg text-black">
                What's the best strategy for winning?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  There's no guaranteed winning strategy! The volatility is random, so it's all about your risk tolerance and timing.
                </p>
                <p>
                  Some players prefer to sell quickly when they see small gains, while others hold on for bigger potential rewards. Remember: the longer you hold, the more the price can swing in either direction.
                </p>
                <p>
                  Watch the background colors for visual cues - green means you're currently profitable, red means you're at a loss.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="minimum-deposit">
              <AccordionTrigger className="text-left text-lg text-black">
                What's the minimum deposit amount?
              </AccordionTrigger>
              <AccordionContent className="text-black space-y-3">
                <p>
                  The minimum deposit is 0.0001 WLD tokens. There's no maximum limit - you can deposit as much as you're comfortable potentially losing.
                </p>
                <p>
                  Remember: only deposit what you can afford to lose, as the diamond's value can go down as well as up!
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="get-deposit-back">
              <AccordionTrigger className="text-left text-lg text-black">
                Can I get my deposit back?
              </AccordionTrigger>
              <AccordionContent className="text-black">
                <p>
                  Sorry, no, once you deposit your WLD, you must play the game to try to get it back.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="who-built-this">
              <AccordionTrigger className="text-left text-lg text-black">
                Who built this thing?
              </AccordionTrigger>
              <AccordionContent className="text-black">
                <p>
                  Diamond Hands is a project of Paul Gadi (@polats) and Luis Buenaventura (@helloluis)
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}