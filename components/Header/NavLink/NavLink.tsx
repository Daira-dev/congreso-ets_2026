import Link from "next/link";

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
}

const NavLink = ({href, children}: NavLinkProps) => {
    return (
        <div className="flex items-center gap-3">
            <Link 
                href={href} 
                className="font-bold text-gray-800 hover:text-amber-300 transition"
                >
                {children}
            </Link>
        </div>
    )
}

export default NavLink

