
interface VideoSectionProps {
    videoUrl : string;
    videoTitle : string;
}

const SectionExperiencia = ({videoUrl, videoTitle}: VideoSectionProps ) => {
    return(
        <section className="p-5 sm:p-10 text-center bg-[#aaa]">
            <h4 className="text-azul-oscuro text-base sm:text-2xl font-bold  mb-4">Sumate a la experiencia ETS</h4>

            <div className="mx-auto w-full max-w-4xl">
                <iframe
                    className="aspect-video w-full rounded-lg"
                    src={videoUrl}
                    title={videoTitle}
                    allowFullScreen
                />
            </div>
        </section>
    )
}

export default SectionExperiencia;