import { useApp } from "../store";

export default function ThankYouView() {
  const { username } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-6xl">🙏</span>
      <h2 className="mt-6 text-3xl font-bold text-gray-900">Thank You, {username}!</h2>
      <p className="mt-3 max-w-md text-lg text-gray-600">
        Thanks for being part of Friday Feast. Every restaurant suggestion, vote,
        and shared meal makes our group lunches something to look forward to each week.
      </p>
      <p className="mt-6 text-sm text-gray-400">Made with ❤️ by the Friday Feast crew</p>
    </div>
  );
}
