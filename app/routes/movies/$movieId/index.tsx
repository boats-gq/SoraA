import { json } from '@remix-run/node';
import type { LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link, useParams } from '@remix-run/react';
// import { Image as NextImage } from '@nextui-org/react';
// import Image, { MimeType } from 'remix-image';

import { useTypedRouteLoaderData } from '~/hooks/useTypedRouteLoaderData';

import { authenticate } from '~/services/supabase';
import { getSimilar, getVideos, getCredits, getRecommendation } from '~/services/tmdb/tmdb.server';
import { postFetchDataHandler } from '~/services/tmdb/utils.server';

import { CACHE_CONTROL } from '~/utils/server/http';

import MediaList from '~/components/media/MediaList';
import { H6, P } from '~/components/styles/Text.styles';

export const loader = async ({ request, params }: LoaderArgs) => {
  await authenticate(request, undefined, true);

  const { movieId } = params;
  const mid = Number(movieId);

  if (!mid) throw new Response('Not Found', { status: 404 });

  const [similar, videos, credits, recommendations] = await Promise.all([
    getSimilar('movie', mid),
    getVideos('movie', mid),
    getCredits('movie', mid),
    getRecommendation('movie', mid),
  ]);

  if (!similar || !videos || !credits || !recommendations)
    throw new Response('Not Found', { status: 404 });

  return json(
    {
      videos,
      similar,
      recommendations,
      topBilledCast: credits &&
        credits.cast && [...postFetchDataHandler(credits.cast.slice(0, 9), 'people')],
      directors: credits && credits.crew && credits.crew.filter(({ job }) => job === 'Director'),
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL.detail,
      },
    },
  );
};

const MovieOverview = () => {
  const { similar, recommendations, topBilledCast, directors } = useLoaderData<typeof loader>();
  const movieData = useTypedRouteLoaderData('routes/movies/$movieId');
  const rootData = useTypedRouteLoaderData('root');
  const detail = movieData && movieData.detail;
  const navigate = useNavigate();
  const { movieId } = useParams();
  const onClickViewMore = (type: 'cast' | 'similar' | 'recommendations') => {
    navigate(`/movies/${detail?.id}/${type}`);
  };
  return (
    <div className="w-full flex flex-col sm:flex-row sm:justify-center sm:items-stretch mt-3 max-w-[1920px] px-3 sm:px-3.5 xl:px-4 2xl:px-5 gap-x-0 sm:gap-x-4 gap-y-4 sm:gap-y-0">
      <div className="flex flex-col sm:items-center sm:justify-start w-full sm:w-1/3 flex-grow-0">
        <div className="flex flex-col items-start justify-center gap-y-4 rounded-xl bg-background-contrast w-full nextui-sm:w-3/4 xl:w-1/2 p-4">
          <div className="w-full flex flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Original Title
            </H6>
            <P as="p" className="flex-grow">
              {detail?.original_title}
            </P>
          </div>
          <div className="w-full flex flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Status
            </H6>
            <P as="p" className="flex-grow">
              {detail?.status}
            </P>
          </div>
          <div className="w-full flex flex-row items-start justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Production Companies
            </H6>
            <div className="flex flex-col flex-grow">
              {detail?.production_companies &&
                detail.production_companies.map((company) => (
                  <P key={`network-item-${company.id}`} as="p">
                    {company?.name}
                  </P>
                ))}
            </div>
          </div>
          <div className="w-full flex flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Original Language
            </H6>
            <P as="p" className="flex-grow">
              {rootData?.languages?.find((lang) => lang.iso_639_1 === detail?.original_language)
                ?.english_name || detail?.original_language}
            </P>
          </div>
          <div className="w-full flex flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Budget
            </H6>
            <P as="p" className="flex-grow">
              {detail?.budget
                ? `$${detail?.budget?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                : '-'}
            </P>
          </div>
          <div className=" w-full flex flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <H6 h6 weight="bold" className="basis-1/3 flex-grow-0">
              Revenue
            </H6>
            <P as="p" className="flex-grow">
              {detail?.revenue
                ? `$${detail?.revenue?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                : '-'}
            </P>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full sm:w-2/3">
        <div className="flex flex-col justify-start items-start gap-y-4 rounded-xl bg-background-contrast p-4">
          <H6 h6 css={{ textAlign: 'justify' }}>
            {detail?.overview}
          </H6>
          <div className="flex flex-col flex-wrap gap-x-0 gap-y-4 sm:flex-row sm:gap-x-8">
            {directors && directors.length > 0 ? (
              <div className="w-full sm:w-fit flex flex-row justify-start gap-x-4 sm:flex-col items-start">
                <H6 h6 weight="bold" className="basis-1/3 sm:basis-auto flex-grow-0">
                  Director
                </H6>
                <div className="flex flex-col flex-grow">
                  {directors.map((director) => (
                    <Link
                      key={`director-item-${director.id}`}
                      to={`/people/${director.id}/overview`}
                      style={{ lineHeight: '1.75rem' }}
                      className="text-text hover:text-primary"
                    >
                      {director.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {detail?.production_countries && detail.production_countries.length > 0 ? (
              <div className="w-full sm:w-fit flex flex-row justify-start gap-x-4 sm:flex-col items-start">
                <H6 h6 weight="bold" className="basis-1/3 sm:basis-auto flex-grow-0">
                  Production Countries
                </H6>
                <div className="flex flex-col flex-grow">
                  {detail?.production_countries.map((country, index) => (
                    <p key={`country-item-${index}`}>{country.name}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {detail?.spoken_languages && detail.spoken_languages.length > 0 ? (
              <div className="w-full sm:w-fit flex flex-row justify-start gap-x-4 sm:flex-col items-start">
                <H6 h6 weight="bold" className="basis-1/3 sm:basis-auto flex-grow-0">
                  Spoken Languages
                </H6>
                <div className="flex flex-col flex-grow">
                  {detail?.spoken_languages.map((language, index) => (
                    <p key={`language-item-${index}`}>{language.english_name}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {topBilledCast && topBilledCast.length > 0 ? (
          <MediaList
            key={`movie-top-cast-${movieId}`}
            listType="slider-card"
            items={topBilledCast}
            listName="Top Cast"
            showMoreList
            onClickViewMore={() => onClickViewMore('cast')}
            navigationButtons
            itemsType="people"
          />
        ) : null}
        {recommendations && recommendations.items && recommendations.items.length > 0 ? (
          <MediaList
            key={`movie-recommendations-${movieId}`}
            listType="slider-card"
            items={recommendations.items}
            listName="Recommendations"
            showMoreList
            onClickViewMore={() => onClickViewMore('recommendations')}
            itemsType="movie"
            navigationButtons
            genresMovie={rootData?.genresMovie}
            genresTv={rootData?.genresTv}
          />
        ) : null}
        {similar && similar.items && similar.items.length > 0 ? (
          <MediaList
            key={`movie-similar-${movieId}`}
            listType="slider-card"
            items={similar.items}
            listName="Similar Movies"
            showMoreList
            onClickViewMore={() => onClickViewMore('similar')}
            itemsType="movie"
            navigationButtons
            genresMovie={rootData?.genresMovie}
            genresTv={rootData?.genresTv}
          />
        ) : null}
      </div>
    </div>
  );
};

export default MovieOverview;
