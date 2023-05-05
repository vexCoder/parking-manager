import { UserType } from "@app/commons";
import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { trpc } from "../utils/trpc";
import _ from "lodash";

type Props = {
  children: React.ReactNode;
};

const AuthGuard = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const _status = trpc.user.status.useQuery(undefined, {
    retry: false,
  });

  const status = _status.data;
  const type = status?.type;
  const err = _status.error;
  const fetching = _status.isLoading || _status.isFetching;

  useEffect(() => {
    if (!fetching && status) {
      if (type === UserType.ADMIN) {
        router.push("/home/admin/qr");
      } else if (type === UserType.USER) {
        router.push("/home/user/parking");
      }
    }
  }, [type, fetching]);

  useEffect(() => {
    if (!fetching) {
      const unprotected = ["/", "/signup"];
      if (err || !status) {
        const check = _.every(unprotected, (v) => v !== pathname);
        if (check) {
          router.replace("/");
        }
      }
    }
  }, [err, pathname, fetching]);

  return <>{children}</>;
};
export default AuthGuard;
