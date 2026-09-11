import Nav from "./Nav/Nav";
import NavLink from "./NavLink/NavLink";
import NavButton from "./NavButton/NavButton"

const Header = () => {
    return (
        <header className="bg-gray-200 text-white px-8 py-4">
            <Nav>
                <NavLink href="/">Inicio</NavLink>
                <NavLink href="/congreso">El Congreso</NavLink>
                <NavLink href="/programa">Programa</NavLink>
                <NavLink href="/participa">Participa</NavLink>
                <NavLink href="/contacto">Contacto</NavLink>
                <NavLink href="/materiales">Materiales</NavLink>
                <NavLink href="/como-llego">Cómo Llego</NavLink>

                <NavButton text="Ingresar" />
            </Nav>
        </header>
    )
}


export default Header