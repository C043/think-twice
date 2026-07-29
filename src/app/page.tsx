import AddObjectComponent from "@/components/AddObjectComponent";
import ThemeToggle from "@/components/ThemeToggle";
import ObjectList from "@/components/ObjectList";
import PushNotificationsToggle from "@/components/PushNotificationsToggle";
import InstallPwaButton from "@/components/InstallPwaButton";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-5 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center text-center">
          <div className="flex justify-between align-middle">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Think Twice
            </h1>

            <div className="flex items-center gap-1">
              <InstallPwaButton />
              <PushNotificationsToggle />
              <ThemeToggle />
            </div>
          </div>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            The solution to{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              compulsive buying.
            </span>
          </p>
          <div className="w-full max-w-md text-left space-y-2">
            <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
              Your Objects
            </h2>

            <ObjectList />
          </div>
          <AddObjectComponent />
        </div>
      </main>
    </div>
  );
}
