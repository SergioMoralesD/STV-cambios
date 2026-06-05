import './menuButton.css'

type Props = {
    texto?: string;
    className?: string;
    tipo: 'button' | 'submit' | 'reset';
    buttonRef?: React.Ref<HTMLButtonElement>;
    onClick?: () => void;
}


const MenuButton = ({ texto, className, tipo, buttonRef, onClick }: Props) => {
    return (
        <button ref={buttonRef} onClick={onClick} className={`menu ${className}`} type={tipo}>
            {texto}
        </button>
    )
}

export default MenuButton  