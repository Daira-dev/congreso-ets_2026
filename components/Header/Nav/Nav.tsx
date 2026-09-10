import Logo from "../Logo/Logo";

interface NavProps {
    children: React.ReactNode;
}

const Nav = ({ children }: NavProps) => {
    return (
        <nav className="flex items-center justify-between">
            <Logo />
            {children}
        </nav>
    )
}


export default Nav