import Link from 'next/link'

export function HomePageContent() {
  return (
    <div className="flex flex-col gap-16 items-center">
        <ul className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
          <li>
            <Link href="/home/book-club">Book Club</Link>
          </li>
          <li>
            <Link href="/home/dota-den">Dota Den</Link>
          </li>
        </ul>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
