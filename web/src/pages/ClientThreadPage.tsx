import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientThread } from '@/features/client-view/api';
import { MessageItem } from '@/features/thread/components/MessageItem';

export function ClientThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { data, isLoading, isError, refetch } = useClientThread(threadId);

  return (
    <div className="space-y-4">
      <Link
        to="/c"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to your queue</span>
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-foreground">{data.subject}</h1>
          <div className="space-y-3">
            {data.messages.map((m) => (
              <MessageItem key={m.id} message={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

