import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Printer, FileText, Users, Package, Settings as SettingsIcon, ChevronRight, Search, X, Truck } from "lucide-react";

const LOGO_DATA_URI = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCADwAPADASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAABgIDBAUHAQAI/8QARBAAAQMDAwEHAgMFBgUCBwEAAQIDBAAFEQYSITEHEyJBUWFxFIEykaEVI0JSsRZicoLB0QgkM+HwY8IXJUNTkpOic//EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAgEQEBAQEAAwEBAAMBAAAAAAAAARECITFBElEDInFh/9oADAMBAAIRAxEAPwDVkkehpSUg525JpG3xdB/vTgwBknnywKBWCRg5BFOpOBj+lN+LqfFnyp1AyeP0oHUkYrxOOh4pPTk14nJ9vmgWAc0sdc0kcpHnSwnIzig6k8EeVd56A810Jx70oA0HsH/evA84pWD0rwTk0HOaUnkV0Dr5VzH2oO4FdUd3WvAcY/0rxTj1zQJ6dOle9s0rFe2g8edBzNdCgU817Fc5IOKD2fI81zb4vOvA45Ne6n0oEr5pIJPXmnCnINICcK60HhScZNKI4xXNuMkmgScnJFIKlAc5PvSzwM4rhGR1oOFeR1xXA5j0rxThPvSSPXrQV6U9SMV1OM486QCo9Bjn1paUkcjOfegcxgZpxv3+M00lO7zHSnBkA8ZoFq59qUgJ+9NoVuPi4p8oSrHXigU2MqIpwccUlAIzn8qUPOgUPmlD3NNLcQygKcUEjOPcn/WqO+60tOn4plXOcxBYPCVOHK3D6JSMkn4B+1S1cEJWltJK1JSD6nGa6hanMlDaiAMlSvCB/r+lfPuqf+JZLTi4+lrZvc6fVzQVKPuEA8f5lfaszvOstba2WUz7pNebUf8AohWGx/kThP6VNpj6wvGvtKWLcm56otTDg6tNL71Y+ycn9KEpv/ET2eQcpTJvE8j/AO1H7sH7qKf6V88wOzy8TsAtu4PqcD8hRBC7FpbuCoJT6+Gnkac7/wAU+jkKIb05dnR6rkoT/wC415v/AIq9HqOF6YuaB6ploJ/qKA2+xVzHK1Dy4GKW52KugfjUD55FMprToP8AxLdn0sgOs3yET5lCXQPyWf6UU2ntS0JeyEwtXQUOK6NzQWFf/wBBIr52l9jMtO7YkHHmUiqCb2aXWFnu0Kx/cJp5PD7RQhxxkPtBEho9HGFhaT/57ZpsKCsgHkeXQj7da+K7Vc9YaKeL1quM6CoHJDTikA/IHhP3FaXpb/ifuTCkRNX2pq4N9PqWQGXx7/yK+235pq4+itvvXQDih/SuudP60YLtgujctaRuciPfu5DY90nqPfkf3qvUuhZKRwodUkYKfmrLrOFHiknrkGu+p/WkbeevAqjua4SMcda5x50joc0HifKuV5RpGcjnigUogHrTa1HqMelKwMdaQQc+1BFGEnA6V3aDzn7VxOPPk/1peB6UHUJOKc4SOv8A2pIGKcGFDGAaBKWyckD/ALU6gnGTnrXUpAAx9qUPPjJzQdByOtRJ1zahZSFJU4AcgnhPuf8Az5xVbqHU8WzxXlrkIZQynLz6jgNj29/L54GT0+cNddpVz1m+u02gOM2/O1Q6Ke56ue3ns6eZyembf4sn9G3aB28tW9bsPT6kTphykylDc0j2Qn+P5/D/AIqyMQNQ60uCplxfkyXXeq3FEkj0z5D2GBRho7ssclKTImpUonkk+da7b9KwbBa35ZYKkxmVOlKQMqCQSQPypIazHTHZGNqFSW8/3cfrWl2bs9hQgnawnI9qu2pUVpptxpWW1oS4l0cJAIykgeY6deufKiG3uszWO9awOdqhn8Kh1H/nlirEVcXTsdkDa2B9qnJtraU8JTQdrPtBkWSdLix34EVmM2hRed8Ti1FKlKShGRkgDNEGl7q7Ljux5cz615GHA8WwglJ8sZ8j+hFUJVJZYvoQpouMxoqnHAE7huW4lKcj2AX+dOvzI8mRAfbZCW3HFsLUEgBW5G5PTg4KCM+5rP8AV9ng3+8zH5RmqUwpDDSWHlIQQE7lbsdfx4FUlmsiLBqW2Pwm3ilqQkPqXJUdqFcAhJ/FjkE46kVFbUbW0oHwg1Dk6fYdBBQM/FL1BdforaG2JHdPyFBtDiPEWxyVLA8yEg/fFDVt1Pdo9wjR5FyhzI7klDLnetFLoQpWAoEcHj3qoXddCwpSFBTCcn2rOtR9kTLwWplsA+mOtbxPfjQ4jsqStLbLSCtaz0AoWNxYecK8qcdWcKS24koSk9B9h5+ZJ9qg+ZrjpS96UmIlQnHmXGVbm1tqKVIPqFDkH4rT+z7/AIinStq161StZSQlFybTh1v/AP0SPxD+8kZ9Qqj1+ywtS291xppCgh5xkkcglCtpI+4P5Vk2tOyxSCt6O2QQcjHlUxqV9JQ7lHmstPsyGX47yQpp9pQLbqT0II4/8+1SSeT7V8kaG7Rr52aXAwpSFyrU4v8AexVnAOeqkE8JX+ivP1H0xpnVluv9vZmwZIfiO8Ic6KbPmhY8iPQ9PcYNJf6Z/F/5GkkE1zkHnr6V4kAYrTJKiMc81ziukcZ8hSfXPFBw58qaUSD14p0rT6Uy4cpJT19KBhJBNLQR0/161HBpwZA8+KB7JSCUmnW1AjJppBBTxyKWnAPoKB4EeWeR1qj1PqVmzx3Eh5LakpK3XVKwGkYyST5cfl8kVKvd4as8FTpwp1fhbRjO5Xx6D/YedfOXaJqmZqG6mwW95TiQ5mQ4DkLWDz8hJ/NXPkKzb8ak+q/Vmq7hr66C32/vWre0rwpxgk/zKH82Og/hHuTRxoTs5ahttrcaBV61L7O+z9qBHbcWgbsZJPWiLV18VZVM2iEkJfW0Hln+ZrcUqxzxg7c/4h5ZpJibovtVpajtIASAAAeBTep2yu0vsNjAWggj1FAln7VI9jWxEuJW82+4G2ktJ3rJJwePQdf+9Cr2qrmjtCluy3ZUwuuLZi53JQhncSEbBxynHPmR7g1URINxvc6L+wjNTAhWxX0ynkAqfcTyUJSPLw8Z/u9fKtA0Ar+zcaSmBHfcgbS66txZJWr+Yk8bvjr054obXaY8K9yLlvQ47Jb2OQ9xw2BnapZHQ7j0HOM8g1aXHVUcW5bs2YxCjRwEYJ7ttBI/h8s49MmixaTLVp6XcDeZwTMlv7XG20thPd7UHw7ljPIJzgVYqvsS3BLjcCGzG2hKnHMrVuJACffJNZHM7XXQytvTdpkXRLSMKkySWmh7jopX3KaFJfaHd5DQclavciFaQfpbTG2KRnyKuDn/ADUH0km6vuhQbI7pSCgIDKSFZ9ePkfeg/UH1zlubhvidNgx0Ev8A0qAl98JXuCCdnTdzjIxjIyM1hdpXH1Tc1RHZ98WQ0t3v5conO0dMZ9/Wk321QrC2zIQ7MkturLaC1KUDkJyT6Y8qYSvobT2oplx07HFzisqlFsALeYT3hB6KGME5GOvXr71LU/anD3jcVyO+2tLiW0O7kbgcgHcMgfGa+a7ZquRbMfs/Ul9tx/kdPeNj7ZI/Sia39pt9bbKZcaBfY3G9yN+5dx7pHH6D5oNz1hLl361rjMxm5EJCMrSklRVkfiWjIUAPIevPkKyliRN0m0uTY5YQ2NuYckFQyogDYfXJHGenrVtYe0S23t1DdulPtygneYzoLbjePfz/AMtKmFN0u7cq5JX9K0Uub20tpTvGQFOAHctRz0A46kE1Faf2dQTbrBGiuLBUoZ5PK1dSff1+9XNytLcpBBQDkeYrENa3O5ybhDajtraeSd8OSwoqDYGcd2U4ySev39hRjdO1FtT7OnSZKJKo6E/UPpA+qXtwSCODzk48+R7VdZVOuOzyNPjrdaaSrOcFPINZlprUl27ML4pCgt63vKCXmCeFjy69FjyP2PBrbrRfkGRDtzqApcx0s4KslagncV5PTakHPHJIHHFUPaPoBNwZccabHT0qe19NH0lqiJeobCmHw8y+jdHdA/EP5SPIjBGD0II9MkXAr5W7PtTy9G3pVluDqkQ31gpWo4DS+gX7A8BX2V5V9K2G8C7QyVHa+14XB7+v3wfvmnN+VbPsWWcHBpBJwTxSsZ65pvocDpWmXFEY69aRvIHI4pxWADnn0ptR8OKCG2R1FOZBHXHtTbWMHBpwHj4oHEDPrn2NPFYSMqIAHUmmED1z9qota3VUG1GOyf38o92n/D/F/UD/ADVLSM57U9dqYaddjLUFryxEx1A/ic+eePdSfSqfsu0UpShMkt/vFkE+3oB8VSRY69ZawJyXIcMhtvjhWCcH7nKvuK2+AiBpe2NvSnEMtlSUDdxkn/zNTn+tX+LyFDbiMgJAGBisn7XY0xuZHu0NRTIiklKvIpOQpJ9iCQfmtSY1HaZrawzOYKkgEpKwCATgZ59awDU+rHX9e3aI+vv3UOd020pW1lUcDOEj+cZyT14PUcVWVJa1m4Ppntym3pkvwoQ1kLZwogthP+vnn5otF5bsSAwiQHJaSWlSR4wgE/haI9+qunpjqRtKYNm+oTDStqU+4VunZvU2jHKARjaSnlSh8etVU69OwWV/s9Sy9K/dJaBUQQf4lHPCePw9Dj5qKvrjrJuzFLEZP1sx3lllvjAPmo+Sc/n5etBd2u7syYHLk7+17gnhuOk4jRfYAefsPuTUFLiyt2NGf8ZP/OTioZPkQkkjjy4/pR9ozS9mhvRm5EmM4qTzGfS5lp7kgpCiBtUCMYPPXpxlbIslvoKw9KXzURSZRX3Q/C2BtQkeyRxRKz2XxoUfv57oabGNy1nalPyfKtS0hJs93TJTb8K+nI4x+JJJAUPYlJoe1tqmO6WYdunwFNyWVB9DxcHdo/mygKKeu05GPPIxTZmkl0IwrFaLbc0/RS2Wp3dOLQ254mZbITuWlK0nwuYBIHnt4OfDUq4Wqz3SIxcWbihUdD4YVanAA83IUnkBXG4cHkjoUn1oYZi/tCUqRCYkmIHQ21BTIS8XVAeJLa8dOeFYz4sc1uHZxpvQ+vLPNj29E+OYaUhUdTiWVbyDvSEJyVJSNpBKjjpxiuPXVnl1nEoB/wDhjbbxC+st/iYWpQbUPMBRTn9KErz2YTbcovRVLSpPII4Ird9DuW1q2rs8QEptREVzI4ChnjPmR1PuaEdca6gQ3+5jhKZUZag/ClpKA+nHAQvyycEKHGK6yzNcrzdsYlJcdacDd6jrJQfDLaG11BHQ+/8AX3oltGs34ncs3h9UqEeGbg31z/6gxz88H1omiP2jUUeVDnW2TIhttF5qYUBt6OVIBDS1E7VePCck+R4FAF3aTBDZgxQqG00GJaP4XlglW72UApIz7elSdb4W855aVHvDzDZbL6lxnVbikHwpyMZCvI49Dz7iqu6x4youJTx7hBU4h1vGWwM5I54UCBx/2NDOmVyozJPdiZacJcCw+kOx0k8gAnnHPhPvRHb02G5rRapMxS25ie8jyEBRBPiOHWeSlaSjBx1weoxS9YTnRT2VsXC93Ri+XF4vKZbDLBIwQnzOP5j1J862+XFRKilKgCSmvma5aoMNmHHiF1EhnK0IYO0tuhZ2EHzBSATnGM9Oa35jXVmiW6L+0blF+sWy2p1ts4VuI58PUDOcVrmxmyxlPanokqQuUw2A4g5HH6fBqw7JNbrXHQmQpRfiYZkA/iW10So+4xj5SPWjRN6tOtW5bEXJLQyQr+IdCR8HisbntHROsW5mFIiSFFt4D+U9T/RXympf7F58XK+oA4laAtCtySAQR0INJKlHOKHtE3UTLaqItQLsQhGc9UHOD+hH2FX5UR0Fal2almEZ2k55zXlnjIGa8cKxikkEcHiqiMjkkYx6GnEjA2k4PTrTaTjrTgUD58/NAvdsB54FZJ2p6hLZnOIcx3SRFbI8lHO4j48Z/wAorULhLTBhPSFHhpCln7AmsCvocvF5tluUd5ddL7vnnJ/2Sr/8qzf41z/Rf2S6ZEO2ofdbAdc/eKHoT/sMCme1m7qN0g2tL6GWijehR4HfbsYUeg3AgAnzGPPNHdvQiz2ZTiEBS0oO1AIG444HNYHra+fty9yHFuTY8d1ediysYRnAGFJ2+JZHQnFTq5DmbTU+2mY5HkuS0COl4tym1/8AVjkDODknKcc5B+2a9Lu/7QQ0tgi4SEjIJaQVJA4ylROVcEccCtI0ha4VzsEuxXe22N1ciO4IMpg7SXEA7kOgnKFk46YHQ85zWJtP29BSHHYyFIcWpMdxC3lNKBPBIKc/JPNY473W+uMXcGa61cm7alx1LxKShU0FlUWRuBB3nkZweDkHOeMZoi7Quz/UMa1ovTbcBaLi02y47DKRu2Z3KwOOqVE4J+45oSiXFFlXGfnx2n2ZbS3+6WlS0qOQADk527eODkc45rTLfd7ZrXRF60xaWExWA03Pt0N2ZvLS0Hcpls9TkZGOMgDIBBrF6u+HSczGaN29NljBttKwhlHeF9kNuqKvIFJwoD1Iz68UR9nTUKFcW16gs0uYw46EfWRlEIjKURvLm0ZSAPMckj2xQVGb/at1THchR4yy8VrQlCTvIJyckZByMYBx7VZ2vX9w0dOXbEulMdRdiSUlOS+0Vk4PI5CuQoEFJ59q11u5GeJM2tb1i3buzu+PtaZhSpSbxCbntvtq7wLbQT4hk5P4k5Tn+IkcjBxe+anZuVxcMS3LgyX1YW9HdLQUs+ycbuvJVk8+VaTfNbW+foyA7LuoVeLIt1pcJ1sNrdjuDPg8OFKChkgEj4rKLapi836OkNphtJX+6ZS3+HrgcYAPJUfypzc58/E6m9ePq6bkf2UvbEZ/epkRlJABwecZWk+vB/KtO0R2poul5sdxVbIpuEZz6VT7Kkt/VjJT3ikgZSohZChg7t2RWe9ollcK3i+EBxqG00kpP4XEbSofkrNB2l5Zg/WF94ttowkrR4XUdQS2ocpUQSPTn4rHPP6n6+t9dZfz8bx2jrn6Uk3+BHaitPSZf1aAl1xO7ekZKFJAVuCk9Mc5rJpk+RJdMO6y3HojH714uoWHCrBwCF5KSTxkHBHlTOotUz9SQm2Z97uT8aKpLcJD6fGUAbcrXgZISBzzyfmpNvtRkaMuD7qNslbjKElzJI3K44PsDW/XM3/jMm9XGpdm6b7pqOxJ+igXbTcR0JlsobaEqOVpO1sBX8CuOT1zjOQa920WhqDe1qgwIhhzoSZrL6h3fe9Bs9M4OSSPasZs2s7hFvKW1THmi4n6Rzc6UIxu6KxkKSOeoOOoxitE1tqiy6g7P4sJ56fFvluKu7kvMlxM5HBwleSCMkjdxyBxjisTmyy1q2WWQCthpyKzCbhW+P8AUr3KkNLSstpzzlaVHnnkKHpij7s9bk2lAkO6ZTerW8tvvJe5anojSlDKnACCpJSMAZAOD5g0E6cgIuljvk99anHkRVZykAnB2jke5qLbO0G76dmNxEynYwZaVDeQkD940eqFZ4UnIBweR5EGtXbbIkyTa1jtZtVo0hPtdx09HXHiXdsLbkN52gDIO5KuQsAgcEHhQNAqVOyZ6ZryLi8llvxPxVNqJb9SMk8HnOD+lFVx1Pa792fOWS93Zce7wXfqIhlJKmXEnOUBSQUqPHlyQrPrjMrUyi+vx7dDiJHeq7xz9whK8+yx4gD6EmnPjnKnU3rRroq93q4z+5scNt2SlRSsbihLrJIOSgdXPCTlHBB6cGrrVdkvtyZuqbrDWxj/AJiKV4JVzwAR/CAE+53E0GWW5acefd/tImQ33cgslUBWx9hpOEgtnocYyUnqDxyBWtftGJqvTbLSJD8qRp50Fp1LPdByGpOwFYGPwkpPTPHP4cmTrK1eZlQ+yDUZWLe44vO5P0L2T/EMbCfts/WtqOFAH1r5k00tyz367W1J24UmS1j1Bxx9lj/8a+j7VOE6AxJRyHm0r+Miu/Pjw4Xz5Szxzimlkq6ED3pZPBFJKcA4rTKID59TXRxwfzpCBgHilngeIfagGe0Kf9JYXkg8ulLeM+pyf0BrNdHRP2jriS4rlMRpDQPvgA/0V+dGPaa/3iYMbP43Tx9sf+6hXQExMGNfb2psu4fUvYkZUQOcAf5jWfrXxfdrmoLXbrEbTLcUl2Sjc3hJwNp9QRg+mOaxvT9s+usF5e2uYWEBohW5SRvAGTkkHlR+1GN0vEXtGSZMgGJHaO9DYOXQjz3ehOD78HjpUbUltnaNjSkswFRoKbjF4wP3wCFObkkH8BSB5efsa5d9b4jr/j5zzQDpjV8/Sd/W8ZKWnozneNPLQHPEDgZB/FkDGMjGTioEi4Jvdylyvp2mUSnCt36dBAA6nCSeBk/rTxtTN8urpBVHjIxuUltS9p9BgHJxmtV0b2dxTBmQ7Iy1LuLkZxxKHVE98pGApAI/iAUSAOpRS9c8/wDTnm9T/wAD2urO27ZIDPhC2YG/ryne6Sj+mM+4rNYV5kQIjkLYl0FR2Fznu89dv8pOOoI86PdYfW2K4ONSHUvIMCOwp4OBYJCULKAQBjBJGMZHnzmommNOwGFh+9wXEuutlxAkIwgD+FIGcknjnHAJqcf6850vX+3W8u9nFkfe1HCdmocQmQQptz1AOeB6cfkKqdeQ231ouDPKJCnHUknyLhGPtg/Yitqd0u1crBE1C1OZYg21Lrctnut3dvbVJZOUkK2ueADy3cefGJTYsll5izT0KQGnSlwg87QolWD69anFt6/a9STn8E2CLd9SrZhqPdxEpONycp6YJA8uE5OPQ0dy9NxdO2W3OMsSHJTz4ShZaJClBxQXuWOhwEcf3j5CqkyYdruDirGwWmFsqClqWpe1tR4Tkn3/AP5Na72U6niXmVK0wtQ75191+HJKtqo8pJO0gkEFKuAUn1PUKNZ66tufGuecm/WQXS7OTZmpYk8o+o+oSoAZwlSHNitueegP2oPTFcW9KQz36kqILjbKtu4FRAz7Zxx71ovbFpl3Td0750suTZCFOzHY/wD0+9KypWPRO4gA+nBqr0rp9J0+5dUSmHZkxZjKiHlYRuSQojyGEfJKxWpZzz+oxZeuvzVHadHTpz6UyFFllIASoPhYBKgPXAwSM0SWuXGTaIFnW6ork3BSVrIJUAgEJOfPxEGkaIu8Bd7TCuqA7bEl2M82BkqbKgDgeZGAr35oo7VNAHSceK7bmnkQLYrvGZieW5Xeq7xKkegCdoPUbunFTq/q5WuZOZ4Y/eYJZuS3tnKgXCAc8kk0/HiXm6uKTI71plCe8ORgYPi4HlnGePmrzS9pl324SbklsORbeCp7kAnclQHXrzjj3FS7BPbj3xuJOaKmGHtjjfm6lSDuQfcg8e4rd7zwxzxvlPtb7Vl09crZcCkvrltQnMq8QQVZV9sJH5UFargFi9yXXE7j3iwfLcRxn74zWv8AaL2dQ7Rpxp6x98/AcP7VRNIJb2lIQGiCMhxKgrI9OeDkVnVjtk3Vd7dWlovNRcSZRVjJbKsK68dCT9qzx42r3d8BVu8TVMohJdV3TR4QkcFWMZA/mxxmjvsthJZuz02SlTTkRsvqycgpSDxj9Kr7fAt9vkd0mM2mawnc0Fjk5GRk/kPuaO9QaGudttEy8tvx0wJEDuondnuy8S6AWz/MtIUrI4OBnGAcO+p1Pzz9Xjm839dfGTalgGNLj4UUBbSO/wBvOTkkn8sGiPTs+8MhLWm3LitKwW0uMq7sEnPDwPhWkZPXHkecVVSpJui4sZaPGlCGl7R+HAwSftmivs5s8uLMfaeCUpadKQEdFAfxfBrpPMyuVuXYs7vFetmq7Qp11Ty32PpnHVcd4raRn81Ctr7Op31enWQSCWVLb/XI/Qisk7R2DG/Zc7opmSg59uv/ALa0Xsvf7tFwino2/lI9jx/7a39Z+D854NIUs884rufXFIJ49K0yiJ5B5/WlFYSjnk4pKQCMjrSHjhvmgzntAf3XaCn8RSFED/Mn/as6tGr4Vk0qGJDTynpq1keHw4yE5Jo7104E3uKonAAxk/4hWI6ltkqxM2y1LU65OfjpkuJUSUsoXkoQB64GT8j3rH1qLly9ypdwSl1ZakNo7lACsJCsHJ+TxRHcO1OFd9Ht2S5WtblzjoVGbmb/ABMtFQJbCc+RTn744FZ5ee9TEZvCsIc70MSGweQtKcpWR6KAx/lNWtrk6d1WqLabipqBLXlCbu2hRVkDw96gZK/IZTz81y/Enl2/dvgi3XZ6DZTFYdIjSH1HvEjHj3Y/Pbj8qurHquRp+XFuEBaxGiP+NRPLR3ApUT8+fuPehS0soMqXpl5/vXFPbYz+ClKXAfCohWCAfPPTNRrHe3bXcFtPBnaFFLzEhBUhwchSFAdQf9KXjdJ3ngY9pevbdrSWiTGtKbZ41LLbZCgVrWFLJ+SVH5NU9xujqpxVM3b2UZSArqcDB9+D+tPTrPprVEO53CyvIsUuC2HjCUVuNyecYbwCU4P83HvVU843fNONzGELM23JDb//AKjJVhJ+UkgH2IpOZ6ifqzzR5o7tMk6FdnJkRGrhFkoPdNSMbFoK8hQJB8SVY+9Bl5vse76j/aLjZbLrqyttJ4IOP9MjPrTWl9SwYqO7u9vg3iIRj6aVuBbPTcgp5CiMe3FTLlp/TdysUvUNiuSrc9CWAu1StzilgnqhaRjH+LHyaTmT2t6t9IFyW7bZUqMdyS2U7RnhSOSk/kat22rgY5udgEhxzOx9qLkutKwFIcTjnBHBI6YqluaH7xpaPef3RXDc+lWQfGUFJUnI9tquaiaa1K7YnhKiTZcOSBtC2HNpI9OfL4IP51bz41J35xZ3LVdzcRJauRkuOymSwsSgc/jyCCeuMfrUiZq+U3FERsx8sowy6zlOwHgjGPEroM+oz5UT6d1xYNbCbb9cW1y5EMkw34akMSErHTkYSeNxyeeBQHYI0KPJur8l1Di4bT30yHCB3qx4U4/vc5+1TOfMwl6mXUSztvTFvORh+/Zy6hv+cAZIHvgZ+1Hkrtgul4t0S1XOQzLgRlICGhwotg5255B4J9KzG3SlwpIWHS0pJBCvcHNaLE1TprUj0O26ktkRhDiti7lBb7txsHorZt8WP8WTWu+Z9icdXPFQLLqOLZLflEFO51alhYcAUoAkgEHonGOnJxVBDdfv93e3PpEl9QWla/CFLz5+mScferdWmbRb9es2du7G4WrvWwiQ+19OFpKsHelR8I4POenNC014ovEpYPdJU85goOQASehHUUkluz6l6smX40JztYvg0+nTbklCIjIKCy6nC21nhQzn1HTGarrfqKHbVTJMSCn/AJl9QCu88aE+iAeMdRnrzx512Pr+Cu1NwrxabddGk4G8sd08B5/vACVH74pnVentLwRa7jYLhcJMKWN0iO+zs+nUQTsSsHxjgg8Dy96zOefV+tfrr3PitF3Vc7q9JcIS7JWUccjBTgD7cY+K0bS/aquy2CTYr7ahcFF5K/3hGWHAkp7wZ6lSVYz1xWXatSxB1JLXAeYdiFxK2FsHKMYBwOByOhHqKurXfrFKiLa1JbG7ivaEtyWHltvtIHRIH4VD5zireJYTuy1NsN5hWW8u3uOXBtZwEd2FJaUvOQc5OOBjHOPSlxe0B+Le31WuKlbskoS0hR8Kcf0z1PP9KqrxpuzsWaLerTfzIjPv7HIDzakyI49SoDYeoxyD7cVZw7fa3NRx34EphMcxmtjOFBTbpbAUk7hzznkZqyTdZtuYv77ql/VWj5Vwkxmo5ZlIShLa9ySMYJB8xk9fetR7OHttzuCSclQQv9Vf71jmi9Ouu6qk6PmFRhXdtwIH/wBp5KVKbcT6EFOD6g+wrVOzp0LvU0p6BCUn5CiP9K39xj5a1ofhBptZwCK82eAc8V5RSQSc1tlDCucc4pDp8JJ6V1KsewNccPg5waDIu1J3uHWZCs8ZH6g/71C1jZI9+i2vWsYodTHaRbbqhPJiOpyELUPJKk4IPsRVn2tM95Az1wrp7YIrO9Ia3uWm7iXYbjffrQWpEV5sKanNdNq0nhQ4PvnkVi+9anrAtdmWLje3Y70tTJeX3X71JAC+iST025xz75qk+jeYktbEK71LgThPJCgcY4rZJ+mtKa6Bc0+4zarkvwqtM57De/0YkHj4QvB9CaCNSafn6OfES52iTBfQylRS+hQw5jBUg4APIChjI5NNMC8ovQLm8+0lwFLxw4eo9vml3eDKeUi6PMlLU0qUF44UsHxfB5zj3p2GxKustxyY44664sFalkklSs4J/Ij71cWCPJkyJOkH8KExYehlxYSlqSgHbyeAFpyg/KT5U9eV3fAesiHULlFC1tj6ZzcUkjy6U7YLy9Z3HkNpy3JaUw8kj8aVcEf0+4FSHboq2RnI0BAYfeStuSr8SnUHHhIPAwRjjnrzTdvtT0lnvsqKuDu8/b/Spm6bmK+RAcjvLbcbIP4gCOoIyDT1q3oiXEpUtKO5G4A43eMcUVOB6/WFtMhKDMsgKVOYAU7FWrAKvUtrIGf5XB5CqyVKixYa7Zb0d6mYELcckIAW04k+LZj+E4HWlvw5nnVfZFypK129sKX9UCA2OijyQPn0+agSYTkQuMvpKFoO0pPkat24MiGESWFFDqMFK8dD61e9oCRfZEXUzLKUJvEUOuttjCW5Tf7t5I9PEErHs4Kvqp7gW02wXLmhITkBCgrjOODUV4rjp7pJO7O9RHrnIosZnwdI9xKta25z0phbcliUzuS05gjKcEcDPHOcgkjGMj0Rh26B1e0ABRISB0BqTzd+NXxM+or8ZxJ7xaMB1IcHuKitNEkEDnrRQw2udaBGe/61sc4J6qYcOOf8KwP/ANlJhRLfbYy5zrxclsPpUmIpHgcaPCvF5HPwAPPPFatyMyahXt98XF1551TjgQlCNxyfw81DehPiOxKcbIQ6g7VY4JBwfvU+XJ/bs6Q5HjpYaKtwaTlQR7bjyasrUy9Os8uzublKgqNwYB8kcIeA9sFC/wDIazz4i9ebQglrKc46+dW7q3EWeAhTiykLcWlO448ucVNttkhremtzZpipSjLGG9+5zBPOOcYGOATkj5rky7pvLkOM3CZiBtoNqKM5d55Uc8A9OnGBS3bkOZktqtjRZdyhPEDeiGC4vnlKScE/GSPzqvDR3L46HGKIHokrT8pE1kAlHCkqGUrSeFJUPMEEg/NOy4Vvi3JiTHfect7oSVLSjarYoHckZ4JBBTnpkZrW4z7V0UOJszie8UEF9PgzhJOCefyoj0KuM9doiSHFqKw4tRTgNgckqJp3Ttsn6oeXZLRb5FwgMvKeQpMdPec4/G50Ske5xkk+dGibfpLQbanLk5Gv11Sncm1QHcxUKHlIfH4/8CBj1NZlbsEdjbjWaRL7QZ4DbCUqh2VCuDMkKBSVpH8iQokn4qR2TL+pkzX853LABHmMqP8ArWU6p1pd9X3cSbi6kvNoDbLDKdrcRrjwpQOEAZ6dehPNa52PxS1bisYG5Z/IYH+lWe9ZvrGsJOEcdKbKsZBPhFdCspANNr6Hg8elbZRUkg8c11zkH4pA4Oefauk8HjmgAu0aKZFsdGMkDODWIFhm5QnIUpKsx39zTzY/esb/AEH8SdyTlOeM5BBzn6H1RF+ohOg9ccCsAlNs27UGyUdsaQe4dUEglIJ4PI8iB9iazVirfk3SxbFTU/Ux3Dhue1lSVp5BBzjPnwQD80U2btGuDUP6NqSi4W4jDkGeBIYTjphpf4DjjwkCqlpuTGlvMyO7aeQe7Vtx3RT6KH4cfPrUSVZLTNUFtoXb384C4vjbz67SeP8AKofFTJWpaN1PaCujTipNjn2F9QSpb9ofDrPhOQSy6QRg+SV0zeez2Ff2lTbNqbT84qSEhMhxUB0Z6eF7AJ+FUFMx9SW9PfRwzdGkH03LT8pOFjI9j81DcvbFylIavaHYqG1lR2s7l8+RGR0+KmU2DHU3ZzfRP+tXpu4xozzSFOrailTLb2ML2qRuBST4gc+dU9gj/RPtRn3dwU4uJ3ZG3byVIOPuoVMsGsjal4sV7mRV8AlEhbBUB7bgB6Ac0WudoWqriw21InwJZcUQl27RWXUAAZwSUZUSAfPPzSbCyUMKTI0/eGZLDyI7D+YklbjYWksOeFYwQc8HPTqBQ7L0tIsepZkCVlS4bmxS9qhvR5L55AIIVzWhOXa2vqSxetK6ceU8dzf7NkLZwkZByEqIzuAI9ifSnFSNL3Bwz58S9JlLYDTimbgl3KUggJHeIyQAByfLzqb53FyZiiesgEQDb5VDg95L0/dtNNWl2ZLYX+1ozyFE9ylCQl4bQDkFGCc4/DRsh3TMhoMIn6hYVyAXYsZ1IHlyFDNDQu0DRGr4t1SJd8hJ3IfZSyGFFBBBHUpVwevkRV6uzwnMy+QI1ait8lJKwrkHPAqdpdpaJ6oqy2G0PFB6btyxwPUjKfz+aJNLWeLdWlOomJt7C3D3LciOta0oJO0qKeOeaII3Z3aYKpS3tUKSXSl1xLNtWspIUMFPiHOfL0q6mBF9Bsl7bc+njOszEqhvJfTlOxzjPUcg4I54IFUciwyf2i5GkhX1DCyy8kHKdyTjPHUHrWn3PTuj7qG3Lhqm6JG4ECPZuUnPRQU5wc8c+dP3ZGjhLkXiVP1RNeKEBaGYkZlTpSnaCdxV4uOam+VzwEbHpZLDRJRnceuKhSzJ0zfYs+I+uN4+6dWlOctL8K0/dJIrQv7QaVixt0axammLAH7t64obUpR/h2tNg5zxjNRJF9tK/GrSFgDvODIefklseQWVqxu9cJ496W7PSSZWZaisKol3dtyXFOmO53aVAjLqDylWBnqCOlXNn7MNS3CbGkwbJcDGSCHXVD6dASRg+NzAole7StR2t1HcOQLalSdwRbYqWkhA4xuSgLHUHJPTFD921iqdIfkXS+fUuJSO7Drqn14xyEkEjJzyak1rwIZuhYQjsxr/AKls8N/btWxCUqa8SPZA2J+6qbYn6IsNvZjQ9Ozr260FLaVe3AG0qJySGEEeg4Us/HWgJOrHHnCw1GkXDCv3TaienptHJ+1PKh6huQUuZIjWhgD8KiQsD0SkZX9uKuW+02fBBq/tBuNyYREmTREgISAIEVpLTQPqGkEA48ic/ehqzw7vqFJMRLcKIn/qXB87W0j2Pr/dTk/FOQ7XarcVOrhuXJ1CgSqUrahWeg2JzjnB8RI45FWkl5+4zkNy23Yzjid623Gw3tAwEBDYGAkDoBxzn1p4h5ppcWPbIES3Q2in6hwuuuLA758J8IKsZCU7irCQfLJyea3js5gmJaWUEYwP16msPszKbvqLLJKo7ag20f8A00ng/c5P3r6N05GEeK2nbgBIrXKVeoHhwRSXDgHiljByOtIcBCSOa0yhpOeqeK6R0I4pCec+ld5JOfKgrbkyFtK9x6VhHaJZtkhzAI3nIxX0BLAAUo4AAyTWYa8jxJeI7bv/ADbiS402UkKWAcEpBHIzgVKM1gSEGzJdbaCnCVNTGUlQ3EYIUByASOc/pTbBMdSg853DauQc7SUq88DqPX4NMSY8rTk9LtxhSYjUpJStt1CmyQDjenPUAny8jT6bLebmw5J+klPxI27L+wqQgAZOV9MDOefWsY3qUHm3H3UsltYBA3gkoUPXHnT6XE3e3IcbdafdhuYeZkoC2nGSrGSlXIKTwcDPiB4xVdaIk1c9tFsjuyH0/vQlhGdo9SOgHlzVxJt17s0kSLlDLRWlRbX3XIT8nqB8mrdnomX2jOaQsN1wn6E2591pbjBjOKWHCgncnulZOcYxggetU39jTHkKah3G4xn2xkpVGUDj1AQrOPtVo2uZeH0xIrLjy3CpxAaTucJxyR9h0HpVmdLagVh5y13RbwHDimnAoffypzueUufAyxatSsxnJ0K8x30MDvFAuYdQOedq0gjzpceVrFYTJbgRpaXSSkoShW4+Z8Ks5oggtXCcpVws8NW1hOJTjEfc0OMkqwMYI5OfekRIrtzkrbtNvUsuN5diRWSUJweFpSnkJzj4rWJqiZump4De1zTr+0ZyQy6MjOecA9OnxXVaskY2ydMvYCtwG5aefumrFMpW5IQslX4cJ6k+2Perxdu1PBimZIt92ZYAzvWlaAB6n/vTE2h6D2jx7ej93pZTa1Jw64JHK/sU02O0CO+giTptyZ0zvfKd2DxnaM46cAjpV9DeulwZd+lFzkdyne73TqyGhzgqA6Dg88Dg03bnLrLaeksN3CXGjgl5aFuFCOCTvUk8DHPPlT8xdqhTraa4tTiNPPKdUQVbVrUngYPGDg5Gf96Wb/qSSAY2l30qCgSotOHI9PwgYq5iyrpd3yzE/aEt7ZvUht5xwhIwM4z+EcDNKgQpV5Dn0kGRPU0AF9yFPbc5xnGcdP0phqlVO1sSV/s6NEP8zm1Kh91ryKiPQ9SPpCpt9gw2lkJJS4No/wD1pNEdwsVygxlSH7XMist4BW4wpKQM8cketPW6zXeYy1LYs0mTHUkLYcS0tTZP8/AO48fFTFgWd0cX5jLci8zJ7yiC4WmVEJR7KWrJJJACcc59qlRdI2+A6BMhrbwnvCHAXlAZISCkFCQVeW7y5wQRV243drBMSpUWYm7Th3aHpDWxYBOMNDyJzjd+I5wMV6XZdSBKlOWe4BAGVbo7iipXmoqIyVHH2AA8qIhTpKVlxplDdviNq8MdptLfH97YBuPzTzrLFsCGn8pWShakf/TTuG4FXH4tvQe9QG1yZMpmJGaU44VEpaxlSnD6eZIA4FcEK6Srw9ETEkrmg7lMbD3qcD+XrjBFZytbD6MvNq7pSA27krUMLA5JyUddoAHn5+/EGW4xCgONoG6c+sNocU3lezqVAryUADA2pPmOaUttbVwLD6Xmn2lBkNrR4kq9NuM56ADrzTKYc528gTYT8WQrCWo7yChSGx0yD+efX4qSLb4G3ZdYh3gcKfQfFbtAb7toJB6CgDQLcCLDQe/BB4LgSSjPsrGCfg1ozCQlsKCgQfMc10jB0K2j1+aQpSiD5UonHWmVLxnGSKqI6eBnNLHIzTSCd3X7ZpzaBnngeVBXXyUI0F49Mtqx69DXzs/LLV6tmCeWH0nn1UK1PWWumGJsq2lCmQykoX3rSsu5HCkKTkcehABz1GKxl11T97i7eRHaVuPoVKzj8hWLfLUi21QtNwsrxB3yLe8l0J6nYsBKh+qD9jSmnUQLPJtiFf8AQgrCxn+IoXn9Qftiqdq4uQ9RvHKQh6M3krHAO0jnPtn9KjwX3X03iQrdh1Kwkn+UNqA/So0t9NyXJllfhRZzUOWVbu9WkqSk4G0qABO3GRnBxk8Uie7rOLEZhXB9Llv73vQ4wpKm5CgOmU+E4BPGAeeRVNZdPRp1ubeReFRJoOUHu1FCU/ylScqB8+hGDVncbi9bbWm3PTUyn3loCloSQF7VZ3YIB4BIyQM5NX6nxIsElKNQRFpGBtdIx67DVrdJOvIrs+VDutvRAb3uJHeMqWloZPT8WceXWhq0qU1dWFYxtbcxtOR+E1PkaXduU99z+04aYfcJ7gpfwAf4SAnHt6Uvsnpfdm97RYrHdZbiv3Ed1kqPXwhIBPv1zirWwwW7H2hSExwRDehrdj4PAQXEeHP90gp+APWgW3PD+zN/aBIQtKgAfZIq80RqDv4LcaUAqVAPcpUT4i2ojB987QD/AIRUv0nwvs4lx7VbLrqF5gPvWxg9yjptVgqJz69BnyycUux6s7WLy09OtyDMYfC2cNx0bGSRg7T1yM+effNUOibvFifXWW5qDUW5owFKVtG7BSRnoCQQRnzFFenrPM0lL+of1DHcs7e5XcbVIyo48Z3JwMY/mPtVpPSP2dvLahataccUVfQbFZOSSEugj86k9mOomrHpi8zJeFR0Psd4PLaUJSSfUAK5HpQ7pKbsa1EtJG19pW054IPekH8jUW1PFGib9G8ndnPr4UUv0nwY6cgf2c7QZ0dJ/wCWcgOLjkHOWytOBn2wR9veofZRNmsW3UIt6ktzDHZDHIA7zY5tznjrjrxUTRl9+ot6W5WVToCTH7xR5LSsY/PaB8p96rdCOOiDd2G3Swp9DbYc5G0lCwDxzxnPFT+kTNSz+0RMBEfUlwiuQZDqUltoskrUnxAeDkYxmryHM1KdAWBrS8lhh9LQ78vLbSCjxYxv4646c0ITdLTLdCcly9SJnlkApZ3PKyokDI3pAB5qU1El3rStrisXQW0soSorJcG8YIx4AT5g81fGENS7hqFzU9sb1LKafmMyI+zuSgpSguBXVHB5FEF4ueuH9SINoEg2oFvK1tAMj+clwjjHPnQjJtDtmuVsU7dU3J5yQhSljvMpCVDjKwD50/J1DKj6lQw6sGI6hCQlSR4FkcHPXrx96UifeLgyrXEFbSiVApU8fMr2r5Pvjbmo8SYpGuJD5WeWV+L5bRVW5bzb7+y62Vlt91brfeHKj4VZSSepB4/L1puM44dSvrJOBHOE46eFGagsr1i4y7Xd2iQluW028kHqoOYCj8YKfy9alvux3r7G+o8aXtynk5wXG20lXd59FHAPtmqK1OuRrjLiuI7xpxxbyUnzIVlQ/IA/KaenlbcqHcOdjalJc9kqGCaCdc7tetR3xUSNlx1tIOEthQSkYHhT0SgZAAGK3vsvbMKwJiOPOuSEq3ud4T4SfJKf4Rx/WvnyRbnZbyZMa4xoSyju3e+SohScg7k7Uq3dB6Gtc7FXO7bumxJ7lT6diinG4AGrz7S+mrKzjPWmyMc804lRPnSFHjk/etsooOOelNyHSlokccY4pQXk89KbfG5O0dKDFu0Kxy7jdFPtk56Gqiz6TeQ2pSkeIj0rY59ubfJykVGatKQDhIP2qYMhY0SvvHe8QTk8UxN0g4hvY2k4862gWpGPw498VGlWdBGSBz5YpgwSfYXI6MbV4/ukgj3BqnZtzzLxkNulak9VLG77KFbrP04h0KBSOaBb3pJ2Msux8pUPSpig6YUXBCWXh9M8T4UE+Bfuhf8AoearV2ru3NiwoEeWTzRCtCEBTMtlKArrlOUK+R5fI/SkG3KbSCw4hTfk1IJW2f8AC4OU/Bz81NXFOYiVPNqODswnAPWnJUJuYtKkYB6cggmpjzTbak/VIXFyeC+N7Sj6JcTxVjFsTrzXeNvRW4ysJL6pCQ01x0yCVHy5CT19jh+jFS7b+/YWnakIaAStSlDCVY4GfM+wzUFu3IcKULcWptPO0k4HwKvp9vkCQHHVIdaLIbbktkKS+AeCo+WOnr0zUJtBKtpBG0gAj59fSrKmOu2yPJMYbgoAcKTkjbn+LHSplwsbEWUw4pxtxSEhQCN2FDy6+dKY8GHCkbATkfzD2qxeeS9HdcWMkoyCgjG3gY9jWba1JMUsixNXRwqadQHxne2VbcefU8cfNQZ9oWqS2wA33m0J3IeCkqOM9c1ZQFtAOrWThDaykE4KuMAdPfzpv6OUwjvpUWS1GdwpKCgbCkA7c7iOQPXn8xVlZxUsW8MSEFSlLUDgJycqPlgU9LsZS8vasKJJxsVwCOvn0/8ABV1BbgR0GQ+ErYSRy6oJAV/L1GceYHWuIdflSHZMaMqUhadpkOZZYJ/mycE8+QFP1/GpP6po1q/cyGiVEgDPUc/PlXhEbVE7qOPqCCd7qs92k+gPVR9hV4u2oS2FXB4OJ6hsAts59dv4ln3P5UpqM9OcCIjXhHhCiMYHsBwKSpgeYs61YDri1KzkJB8X/aiOBpeS8ppW1QA/pRjprRHIceQVLPUmjyHp1psJ8HT2qoy2box1xtIbQQoefpVodHL/AGclpxHIGM1qTdkbPO0ceVSF2lBQElPSriMGRoy4If7prKU55wSK2jQdtXbbc0wrICBgcVKasTQc3bRwauocZMccA0kwWKRxxxSFJJT0rraiQeePeuqxjANUQWyOcnH6V5Q3DGfjmkJPn0rx5UfIZ6UDLre0nNJSjnAGKkrIUPcedJCMHnOKBtTIxnHFNOR88VMbwU5614owrg9aCodilWQEjHkKrJVnQ8kgoonW0kk4B+1MljPNBmF70W1ISohsZoIm6YnW1xS4ylgeYHQ/bzrfXrd3gOR+dVEywNPg5QKlgwpMpxglLzKmyeFFrjPyk8Gm0RLY+srb7pl48b2lGOv9PD+latctENSMkNjNDE/s9W2CW8pz5VnGtDgjXBqO60xdJQYcAyh1lLqVY6Hcgg8fFRnYst/BUm1lQH4kLdZUfsQRVg7pCfGJLW5J9iR/Skfs+9M8d8+cf3s/1qYuoiETW0rSm3sFCk7VBNwSAfzHrTgalvxjFFthpBwCtdwSTwc+Q4p7/wCcoH4l59m0/wC1dCr2RtDjwHoEpH+lCUiNarmlTZjuW6CG1Be5vvnVKIORnIAIyOnSpztrmlSnrnqCYpSieUlDHzySpVMC23qV4VvSSD5Fwino+ipjygVgDPU9TTKbEPubBBWXGEJef6lwJLqyf8a/9BSfr5s1ZEZghXTecqV+Z6UY2zs7QrBcClH3oqtujWWMAMgAVcTWd2nRkme4HZRUsk85Oa0Ky6PZioT+6Ax7UTQbM2yAEoH5VasxkoGMcVqRlXRLchnjaBVg3Fx5f96e7r0I45p5P4feqGUNAeWPanO6AzxSkYycjmljr8edA0loDyx704njpzXiD5GlAZzjnigWnAHNIUoY9aSQU+fHpXCSTnk0ENAz1PT0ruASSetIQCQetePBxnH+tAojB3edLxgcHrSPfH3rucZPnQLCcfNdI44rgPHNdyN2CeKBvAVnOfinA2evnSgQAeB810LyPn3oG+79qQqOkhXGakdDjy864QEjg0EExQc5FMO21tfBSD61ZnAHkfevd2ME5oB92xNLJ8AOair00wokd2OfaisISc4xXlNAHjHzQB6tKsgf9IZHtS29LMJ/+l+lFfc17u056fNAONadjt9WwTUxizMo42CrkNJGTTgaAOT1oK9u3pRyEinm2EpzxUshOMH4pJHngUCUNgcgUoIz9+OaU2RtNOZT8UDKRgnI8+MeVL24TkjFKJ5z5ivBzPBIxQeCecYpXAHSvbsDH61zIzigSR1FdbB88fauhOTyelLSAnpQJKckkUkp9qdPTOetIVjGKD//2Q==";


// ---------- Storage helpers ----------
const K = {
  settings: "billing:settings",
  customers: "billing:customers",
  items: "billing:items",
  invoices: "billing:invoices",
  counter: "billing:counter",
  dcs: "billing:dcs",
  dcCounter: "billing:dcCounter",
};

async function sGet(key, fallback) {
  try {
    const r = await window.storage.get(key, false);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function sSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("storage set failed", e);
  }
}

// ---------- Number to words (Indian system) ----------
function numToWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function three(n) {
    if (n >= 100) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + two(n % 100) : "");
    return two(n);
  }
  let result = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;
  if (crore) result += three(crore) + " Crore ";
  if (lakh) result += three(lakh) + " Lakh ";
  if (thousand) result += three(thousand) + " Thousand ";
  if (hundred) result += three(hundred);
  return result.trim();
}

const money = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));

const emptyLine = () => ({ id: crypto.randomUUID(), description: "", hsn: "", qty: "", rate: "" });

const defaultSettings = {
  name: "JMS ENGINEERING",
  addressLine: "1/2, 39-B-16, Aringar Anna Colony, SIDCO Industrial Estate, Coimbatore - 641 021.",
  cell: "8610026754, 7708881444",
  gstin: "33BBJPJ1166M1ZJ",
  gstSplit: 9, // SGST % (CGST mirrors this) -> 18% total
  jurisdiction: "Coimbatore",
};

// ---------- Main App ----------
export default function App() {
  const [tab, setTab] = useState("new");
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [counter, setCounter] = useState(100);
  const [dcs, setDcs] = useState([]);
  const [dcCounter, setDcCounter] = useState(0);
  const [printInvoice, setPrintInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      const [s, c, it, inv, cnt, dc, dcCnt] = await Promise.all([
        sGet(K.settings, defaultSettings),
        sGet(K.customers, []),
        sGet(K.items, []),
        sGet(K.invoices, []),
        sGet(K.counter, 100),
        sGet(K.dcs, []),
        sGet(K.dcCounter, 150),
      ]);
      setSettings(s);
      setCustomers(c);
      setItems(it);
      setInvoices(inv);
      setCounter(cnt);
      setDcs(dc);
      setDcCounter(dcCnt);
      setLoaded(true);
    })();
  }, []);

  const saveSettings = useCallback((s) => { setSettings(s); sSet(K.settings, s); }, []);
  const saveCustomers = useCallback((c) => { setCustomers(c); sSet(K.customers, c); }, []);
  const saveItems = useCallback((it) => { setItems(it); sSet(K.items, it); }, []);
  const saveInvoices = useCallback((inv) => { setInvoices(inv); sSet(K.invoices, inv); }, []);
  const saveCounter = useCallback((n) => { setCounter(n); sSet(K.counter, n); }, []);
  const saveDcs = useCallback((d) => { setDcs(d); sSet(K.dcs, d); }, []);
  const saveDcCounter = useCallback((n) => { setDcCounter(n); sSet(K.dcCounter, n); }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E7E2D2]">
        <div className="text-[#3A4A55] font-mono text-sm tracking-wide">Loading workshop ledger…</div>
      </div>
    );
  }

  if (printInvoice) {
    return printInvoice.kind === "dc"
      ? <PrintDCView dc={printInvoice} settings={settings} onClose={() => setPrintInvoice(null)} />
      : <PrintView invoice={printInvoice} settings={settings} onClose={() => setPrintInvoice(null)} />;
  }

  const tabs = [
    { id: "new", label: "New Invoice", icon: FileText },
    { id: "dc", label: "Delivery Challan", icon: Truck },
    { id: "history", label: "History", icon: Search },
    { id: "customers", label: "Customers", icon: Users },
    { id: "items", label: "Items", icon: Package },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen text-[#1F2A30]" style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui", backgroundColor: "#E7E2D2", backgroundImage: "radial-gradient(#C9C2A8 0.5px, transparent 0.5px)", backgroundSize: "18px 18px" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .headline { font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif; }
        .tab-shape { clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px); }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-[#1F2A30] bg-[#1F2A30] text-[#E7E2D2] relative overflow-hidden">
        {/* punch-hole binder strip */}
        <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col items-center justify-evenly bg-black/20">
          {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#E7E2D2]/25" />)}
        </div>
        <div className="max-w-6xl mx-auto pl-12 pr-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_DATA_URI} alt="Company logo" className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#B5502F]/60" />
            <div>
              <div className="headline text-lg font-semibold tracking-tight leading-none">{settings.name}</div>
              <div className="text-[11px] text-[#B8C4C9] mono mt-1">workshop billing ledger</div>
            </div>
          </div>
          <div className="text-[11px] text-[#B8C4C9] mono hidden sm:block">GSTIN {settings.gstin || "—"}</div>
        </div>
      </div>

      {/* Tabs — ledger index tabs */}
      <div className="bg-[#DAD3BC] sticky top-0 z-10 border-b border-[#1F2A30]">
        <div className="max-w-6xl mx-auto pl-12 pr-5 flex gap-1.5 overflow-x-auto pt-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-shape headline flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border ${
                  active
                    ? "bg-[#E7E2D2] text-[#1F2A30] border-[#1F2A30] border-b-[#E7E2D2] -mb-px"
                    : "bg-[#CFC7AC] text-[#5C6A5E] border-transparent hover:bg-[#D8D1B8] hover:text-[#1F2A30]"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto pl-12 pr-5 py-6">
        {tab === "new" && (
          <NewInvoice
            settings={settings}
            customers={customers}
            saveCustomers={saveCustomers}
            items={items}
            saveItems={saveItems}
            invoices={invoices}
            saveInvoices={saveInvoices}
            counter={counter}
            saveCounter={saveCounter}
            onPrint={setPrintInvoice}
          />
        )}
        {tab === "dc" && (
          <NewDC
            settings={settings}
            customers={customers}
            saveCustomers={saveCustomers}
            items={items}
            saveItems={saveItems}
            dcs={dcs}
            saveDcs={saveDcs}
            counter={dcCounter}
            saveCounter={saveDcCounter}
            onPrint={setPrintInvoice}
          />
        )}
        {tab === "history" && (
          <History
            invoices={invoices}
            dcs={dcs}
            onPrint={setPrintInvoice}
            onDelete={(id) => saveInvoices(invoices.filter(i => i.id !== id))}
            onDeleteDc={(id) => saveDcs(dcs.filter(d => d.id !== id))}
          />
        )}
        {tab === "customers" && <Customers customers={customers} saveCustomers={saveCustomers} />}
        {tab === "items" && <Items items={items} saveItems={saveItems} />}
        {tab === "settings" && <SettingsPanel settings={settings} saveSettings={saveSettings} />}
      </div>
    </div>
  );
}

// ---------- New Invoice ----------
function NewInvoice({ settings, customers, saveCustomers, items, saveItems, invoices, saveInvoices, counter, saveCounter, onPrint }) {
  const [customerId, setCustomerId] = useState("");
  const [customerSnapshot, setCustomerSnapshot] = useState({ name: "", address: "", gstin: "" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [dcNo, setDcNo] = useState("");
  const [dcDate, setDcDate] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustList, setShowCustList] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerQuery.toLowerCase())
  );

  function pickCustomer(c) {
    setCustomerId(c.id);
    setCustomerSnapshot({ name: c.name, address: c.address, gstin: c.gstin || "" });
    setCustomerQuery(c.name);
    setShowCustList(false);
  }

  function updateLine(id, field, value) {
    setLines(lines.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  }
  function addLine() {
    setLines([...lines, emptyLine()]);
  }
  function removeLine(id) {
    setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  }
  function pickItemForLine(lineId, item) {
    setLines(lines.map(l => (l.id === lineId ? { ...l, description: item.description, hsn: item.hsn, rate: item.defaultRate } : l)));
  }

  const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0);
  const sgstPct = settings.gstSplit || 9;
  const cgstPct = settings.gstSplit || 9;
  const sgst = subtotal * (sgstPct / 100);
  const cgst = subtotal * (cgstPct / 100);
  const total = subtotal + sgst + cgst;

  function reset() {
    setCustomerId(""); setCustomerSnapshot({ name: "", address: "", gstin: "" }); setCustomerQuery("");
    setOrderNo(""); setOrderDate(""); setDcNo(""); setDcDate("");
    setLines([emptyLine()]);
    setDate(new Date().toISOString().slice(0, 10));
  }

  function handleSave(andPrint) {
    if (!customerSnapshot.name.trim()) { alert("Add a customer name first."); return; }
    const validLines = lines.filter(l => l.description.trim());
    if (validLines.length === 0) { alert("Add at least one line item."); return; }

    // Save new customer if typed fresh
    let custId = customerId;
    if (!custId) {
      const newCust = { id: crypto.randomUUID(), name: customerSnapshot.name, address: customerSnapshot.address, gstin: customerSnapshot.gstin };
      saveCustomers([...customers, newCust]);
      custId = newCust.id;
    }
    // Learn new items into item master
    const newItems = [...items];
    validLines.forEach(l => {
      const exists = newItems.find(it => it.description.toLowerCase() === l.description.toLowerCase());
      if (!exists) newItems.push({ id: crypto.randomUUID(), description: l.description, hsn: l.hsn, defaultRate: l.rate, unit: "" });
    });
    if (newItems.length !== items.length) saveItems(newItems);

    const invoiceNo = counter + 1;
    const invoice = {
      id: crypto.randomUUID(),
      invoiceNo,
      date,
      orderNo, orderDate, dcNo, dcDate,
      customerId: custId,
      customer: customerSnapshot,
      lines: validLines.map(l => ({ description: l.description, hsn: l.hsn, qty: parseFloat(l.qty) || 0, rate: parseFloat(l.rate) || 0 })),
      subtotal, sgstPct, sgst, cgstPct, cgst, total,
    };
    saveInvoices([invoice, ...invoices]);
    saveCounter(invoiceNo);
    reset();
    if (andPrint) onPrint(invoice);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold headline">New invoice</h2>
        <div className="mono text-sm text-[#5C6A5E]">No. {counter + 1}</div>
      </div>

      {/* Customer + meta */}
      <div className="bg-white border border-[#C9C2A8] rounded-sm p-4 grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-[11px] text-[#5C6A5E] mb-0.5 block">Customer</label>
          <input
            className="w-full mt-1 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#B5502F]"
            placeholder="Type or select customer"
            value={customerQuery}
            onChange={(e) => { setCustomerQuery(e.target.value); setCustomerSnapshot({ ...customerSnapshot, name: e.target.value }); setCustomerId(""); setShowCustList(true); }}
            onFocus={() => setShowCustList(true)}
          />
          {showCustList && customerQuery && filteredCustomers.length > 0 && (
            <div className="absolute z-20 bg-white border border-[#C9C2A8] w-full mt-1 max-h-40 overflow-auto shadow-sm">
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => pickCustomer(c)} className="px-3 py-2 text-sm hover:bg-[#E7E2D2] cursor-pointer">
                  {c.name}
                </div>
              ))}
            </div>
          )}
          <textarea
            className="w-full mt-2 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#B5502F]"
            placeholder="Customer address"
            rows={2}
            value={customerSnapshot.address}
            onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, address: e.target.value })}
          />
          <input
            className="w-full mt-2 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#B5502F]"
            placeholder="Customer GSTIN (optional)"
            value={customerSnapshot.gstin}
            onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, gstin: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 content-start">
          <Field label="Invoice date" type="date" value={date} onChange={setDate} />
          <div />
          <Field label="Order no." value={orderNo} onChange={setOrderNo} />
          <Field label="Order date" type="date" value={orderDate} onChange={setOrderDate} />
          <Field label="DC no." value={dcNo} onChange={setDcNo} />
          <Field label="DC date" type="date" value={dcDate} onChange={setDcDate} />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-[#C9C2A8] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#DAD3BC] text-[#5C6A5E] text-xs headline">
              <th className="text-left px-3 py-2 w-10">#</th>
              <th className="text-left px-3 py-2">Description</th>
              <th className="text-left px-3 py-2 w-28">HSN</th>
              <th className="text-right px-3 py-2 w-24">Qty</th>
              <th className="text-right px-3 py-2 w-28">Rate</th>
              <th className="text-right px-3 py-2 w-28">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <LineRow key={l.id} idx={idx} line={l} items={items} onChange={updateLine} onPickItem={pickItemForLine} onRemove={removeLine} />
            ))}
          </tbody>
        </table>
        <button onClick={addLine} className="flex items-center gap-1.5 text-sm text-[#B5502F] font-medium px-3 py-2.5 border-t border-[#C9C2A8] hover:bg-[#EFE9D8] w-full">
          <Plus size={15} /> Add line
        </button>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white border border-[#C9C2A8] rounded-sm p-4 space-y-2 mono text-sm">
          <Row label="Sub total" value={money(subtotal)} />
          <Row label={`SGST @ ${sgstPct}%`} value={money(sgst)} />
          <Row label={`CGST @ ${cgstPct}%`} value={money(cgst)} />
          <div className="border-t border-[#C9C2A8] pt-2 flex justify-between font-semibold text-base">
            <span>Total</span><span>₹{money(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={() => handleSave(false)} className="px-4 py-2.5 text-sm font-medium border border-[#1F2A30] rounded-sm hover:bg-[#1F2A30] hover:text-white transition-colors">
          Save invoice
        </button>
        <button onClick={() => handleSave(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#B5502F] text-white rounded-sm hover:bg-[#9C4327] transition-colors" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}>
          <Printer size={15} /> Save & print
        </button>
      </div>
    </div>
  );
}

function LineRow({ idx, line, items, onChange, onPickItem, onRemove }) {
  const [showList, setShowList] = useState(false);
  const matches = items.filter(it => line.description && it.description.toLowerCase().includes(line.description.toLowerCase()) && it.description.toLowerCase() !== line.description.toLowerCase());
  const amount = (parseFloat(line.qty) || 0) * (parseFloat(line.rate) || 0);
  return (
    <tr className="border-t border-[#DED7C0] align-top">
      <td className="px-3 py-2 text-[#5C6A5E] mono">{idx + 1}</td>
      <td className="px-3 py-2 relative">
        <input
          className="w-full text-sm focus:outline-none"
          placeholder="e.g. Ø20 MS rod (3/4&quot; thread machining)"
          value={line.description}
          onChange={(e) => { onChange(line.id, "description", e.target.value); setShowList(true); }}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
        />
        {showList && matches.length > 0 && (
          <div className="absolute z-20 bg-white border border-[#C9C2A8] mt-1 w-64 max-h-32 overflow-auto shadow-sm">
            {matches.slice(0, 6).map(it => (
              <div key={it.id} onClick={() => onPickItem(line.id, it)} className="px-3 py-1.5 text-sm hover:bg-[#E7E2D2] cursor-pointer">
                {it.description}
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        <input className="w-full text-sm focus:outline-none mono" value={line.hsn} onChange={(e) => onChange(line.id, "hsn", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input type="number" className="w-full text-sm text-right focus:outline-none mono" value={line.qty} onChange={(e) => onChange(line.id, "qty", e.target.value)} />
      </td>
      <td className="px-3 py-2">
        <input type="number" className="w-full text-sm text-right focus:outline-none mono" value={line.rate} onChange={(e) => onChange(line.id, "rate", e.target.value)} />
      </td>
      <td className="px-3 py-2 text-right mono">{money(amount)}</td>
      <td className="px-2 py-2">
        <button onClick={() => onRemove(line.id)} className="text-[#B0453A] hover:text-[#8a362d]"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-[11px] text-[#5C6A5E] mb-0.5 block">{label}</label>
      <input type={type} className="w-full mt-1 border border-[#C9C2A8] rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#B5502F]" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Row({ label, value }) {
  return <div className="flex justify-between text-[#3A4A55]"><span>{label}</span><span>₹{value}</span></div>;
}

// ---------- New Delivery Challan ----------
function NewDC({ settings, customers, saveCustomers, items, saveItems, dcs, saveDcs, counter, saveCounter, onPrint }) {
  const [customerId, setCustomerId] = useState("");
  const [customerSnapshot, setCustomerSnapshot] = useState({ name: "", address: "", gstin: "" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [refNo, setRefNo] = useState("");
  const [purpose, setPurpose] = useState("Job work");
  const [lines, setLines] = useState([{ id: crypto.randomUUID(), description: "", hsn: "", qty: "" }]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustList, setShowCustList] = useState(false);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase()));

  function pickCustomer(c) {
    setCustomerId(c.id);
    setCustomerSnapshot({ name: c.name, address: c.address, gstin: c.gstin || "" });
    setCustomerQuery(c.name);
    setShowCustList(false);
  }
  function updateLine(id, field, value) { setLines(lines.map(l => (l.id === id ? { ...l, [field]: value } : l))); }
  function addLine() { setLines([...lines, { id: crypto.randomUUID(), description: "", hsn: "", qty: "" }]); }
  function removeLine(id) { setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines); }
  function pickItemForLine(lineId, item) { setLines(lines.map(l => (l.id === lineId ? { ...l, description: item.description, hsn: item.hsn } : l))); }

  function reset() {
    setCustomerId(""); setCustomerSnapshot({ name: "", address: "", gstin: "" }); setCustomerQuery("");
    setRefNo(""); setPurpose("Job work");
    setLines([{ id: crypto.randomUUID(), description: "", hsn: "", qty: "" }]);
    setDate(new Date().toISOString().slice(0, 10));
  }

  function handleSave(andPrint) {
    if (!customerSnapshot.name.trim()) { alert("Add a customer name first."); return; }
    const validLines = lines.filter(l => l.description.trim());
    if (validLines.length === 0) { alert("Add at least one line item."); return; }

    let custId = customerId;
    if (!custId) {
      const newCust = { id: crypto.randomUUID(), name: customerSnapshot.name, address: customerSnapshot.address, gstin: customerSnapshot.gstin };
      saveCustomers([...customers, newCust]);
      custId = newCust.id;
    }
    const newItems = [...items];
    validLines.forEach(l => {
      const exists = newItems.find(it => it.description.toLowerCase() === l.description.toLowerCase());
      if (!exists) newItems.push({ id: crypto.randomUUID(), description: l.description, hsn: l.hsn, defaultRate: "", unit: "" });
    });
    if (newItems.length !== items.length) saveItems(newItems);

    const dcNo = counter + 1;
    const dc = {
      id: crypto.randomUUID(),
      kind: "dc",
      dcNo,
      date,
      refNo,
      purpose,
      customerId: custId,
      customer: customerSnapshot,
      lines: validLines.map(l => ({ description: l.description, hsn: l.hsn, qty: parseFloat(l.qty) || 0 })),
    };
    saveDcs([dc, ...dcs]);
    saveCounter(dcNo);
    reset();
    if (andPrint) onPrint(dc);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold headline">New delivery challan</h2>
        <div className="mono text-sm text-[#5C6A5E]">DC No. {counter + 1}</div>
      </div>

      <div className="bg-white border border-[#C9C2A8] rounded-sm p-4 grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-[11px] text-[#5C6A5E] mb-0.5 block">Customer</label>
          <input
            className="w-full mt-1 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#B5502F]"
            placeholder="Type or select customer"
            value={customerQuery}
            onChange={(e) => { setCustomerQuery(e.target.value); setCustomerSnapshot({ ...customerSnapshot, name: e.target.value }); setCustomerId(""); setShowCustList(true); }}
            onFocus={() => setShowCustList(true)}
          />
          {showCustList && customerQuery && filteredCustomers.length > 0 && (
            <div className="absolute z-20 bg-white border border-[#C9C2A8] w-full mt-1 max-h-40 overflow-auto shadow-sm">
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => pickCustomer(c)} className="px-3 py-2 text-sm hover:bg-[#E7E2D2] cursor-pointer">{c.name}</div>
              ))}
            </div>
          )}
          <textarea
            className="w-full mt-2 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#B5502F]"
            placeholder="Customer address"
            rows={2}
            value={customerSnapshot.address}
            onChange={(e) => setCustomerSnapshot({ ...customerSnapshot, address: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Field label="DC date" type="date" value={date} onChange={setDate} />
          <Field label="Ref / order no." value={refNo} onChange={setRefNo} />
          <div className="col-span-2">
            <label className="text-[11px] text-[#5C6A5E] mb-0.5 block">Purpose of delivery</label>
            <select className="w-full mt-1 border border-[#C9C2A8] rounded-sm px-2.5 py-1.5 text-sm bg-white" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option>Job work</option>
              <option>Sale on approval</option>
              <option>Sales return</option>
              <option>Supply of goods</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#C9C2A8] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#DAD3BC] text-[#5C6A5E] text-xs headline">
              <th className="text-left px-3 py-2 w-10">#</th>
              <th className="text-left px-3 py-2">Description</th>
              <th className="text-left px-3 py-2 w-28">HSN</th>
              <th className="text-right px-3 py-2 w-24">Qty</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={l.id} className="border-t border-[#DED7C0] align-top">
                <td className="px-3 py-2 text-[#5C6A5E] mono">{idx + 1}</td>
                <td className="px-3 py-2 relative">
                  <DCDescriptionCell line={l} items={items} onChange={updateLine} onPickItem={pickItemForLine} />
                </td>
                <td className="px-3 py-2"><input className="w-full text-sm focus:outline-none mono" value={l.hsn} onChange={(e) => updateLine(l.id, "hsn", e.target.value)} /></td>
                <td className="px-3 py-2"><input type="number" className="w-full text-sm text-right focus:outline-none mono" value={l.qty} onChange={(e) => updateLine(l.id, "qty", e.target.value)} /></td>
                <td className="px-2 py-2"><button onClick={() => removeLine(l.id)} className="text-[#B0453A] hover:text-[#8a362d]"><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addLine} className="flex items-center gap-1.5 text-sm text-[#B5502F] font-medium px-3 py-2.5 border-t border-[#C9C2A8] hover:bg-[#EFE9D8] w-full">
          <Plus size={15} /> Add line
        </button>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={() => handleSave(false)} className="px-4 py-2.5 text-sm font-medium border border-[#1F2A30] rounded-sm hover:bg-[#1F2A30] hover:text-white transition-colors">
          Save challan
        </button>
        <button onClick={() => handleSave(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#B5502F] text-white rounded-sm hover:bg-[#9C4327] transition-colors" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}>
          <Printer size={15} /> Save & print
        </button>
      </div>
    </div>
  );
}

function DCDescriptionCell({ line, items, onChange, onPickItem }) {
  const [showList, setShowList] = useState(false);
  const matches = items.filter(it => line.description && it.description.toLowerCase().includes(line.description.toLowerCase()) && it.description.toLowerCase() !== line.description.toLowerCase());
  return (
    <>
      <input
        className="w-full text-sm focus:outline-none"
        placeholder="Item description"
        value={line.description}
        onChange={(e) => { onChange(line.id, "description", e.target.value); setShowList(true); }}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
      />
      {showList && matches.length > 0 && (
        <div className="absolute z-20 bg-white border border-[#C9C2A8] mt-1 w-64 max-h-32 overflow-auto shadow-sm">
          {matches.slice(0, 6).map(it => (
            <div key={it.id} onClick={() => onPickItem(line.id, it)} className="px-3 py-1.5 text-sm hover:bg-[#E7E2D2] cursor-pointer">{it.description}</div>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- History ----------
function History({ invoices, dcs, onPrint, onDelete, onDeleteDc }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | invoice | dc

  const combined = [
    ...invoices.map(inv => ({ ...inv, _type: "invoice", _sortDate: inv.date })),
    ...dcs.map(dc => ({ ...dc, _type: "dc", _sortDate: dc.date })),
  ].sort((a, b) => (a._sortDate < b._sortDate ? 1 : -1));

  const filtered = combined.filter(doc => {
    if (filter !== "all" && doc._type !== filter) return false;
    const num = doc._type === "invoice" ? doc.invoiceNo : doc.dcNo;
    return doc.customer.name.toLowerCase().includes(q.toLowerCase()) || String(num).includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold headline">History</h2>
        <div className="mono text-sm text-[#5C6A5E]">{combined.length} total</div>
      </div>
      <div className="flex gap-3">
        <input
          className="flex-1 border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#B5502F]"
          placeholder="Search by customer or number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm bg-white" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All documents</option>
          <option value="invoice">Invoices</option>
          <option value="dc">Delivery challans</option>
        </select>
      </div>
      <div className="bg-white border border-[#C9C2A8] rounded-sm divide-y divide-[#DED7C0]">
        {filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#5C6A5E]">Nothing here yet.</div>}
        {filtered.map(doc => (
          <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#EFE9D8]">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded-sm ${doc._type === "invoice" ? "bg-[#DAD3BC] text-[#1F2A30]" : "bg-[#DEE8E0] text-[#2F5C4A]"}`}>
                  {doc._type === "invoice" ? "Invoice" : "DC"}
                </span>
                <div className="text-sm font-medium">{doc.customer.name}</div>
              </div>
              <div className="text-xs text-[#5C6A5E] mono mt-0.5">
                No. {doc._type === "invoice" ? doc.invoiceNo : doc.dcNo} · {doc.date}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {doc._type === "invoice" && <div className="mono text-sm font-medium">₹{money(doc.total)}</div>}
              <button onClick={() => onPrint(doc)} className="p-2 hover:bg-[#DAD3BC] rounded-sm"><Printer size={15} /></button>
              <button
                onClick={() => {
                  if (!confirm("Delete this document?")) return;
                  doc._type === "invoice" ? onDelete(doc.id) : onDeleteDc(doc.id);
                }}
                className="p-2 hover:bg-[#DAD3BC] rounded-sm text-[#B0453A]"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Customers ----------
function Customers({ customers, saveCustomers }) {
  const [form, setForm] = useState({ name: "", address: "", gstin: "" });
  const [editId, setEditId] = useState(null);

  function submit() {
    if (!form.name.trim()) return;
    if (editId) {
      saveCustomers(customers.map(c => (c.id === editId ? { ...c, ...form } : c)));
      setEditId(null);
    } else {
      saveCustomers([...customers, { id: crypto.randomUUID(), ...form }]);
    }
    setForm({ name: "", address: "", gstin: "" });
  }
  function edit(c) { setForm({ name: c.name, address: c.address, gstin: c.gstin }); setEditId(c.id); }
  function remove(id) { saveCustomers(customers.filter(c => c.id !== id)); }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold headline">Customers</h2>
      <div className="bg-white border border-[#C9C2A8] rounded-sm p-4 grid sm:grid-cols-3 gap-3">
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm" placeholder="GSTIN (optional)" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
        <button onClick={submit} className="sm:col-span-3 px-4 py-2 bg-[#1F2A30] text-white text-sm rounded-sm hover:bg-[#111A1F] w-fit">
          {editId ? "Update customer" : "Add customer"}
        </button>
      </div>
      <div className="bg-white border border-[#C9C2A8] rounded-sm divide-y divide-[#DED7C0]">
        {customers.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#5C6A5E]">No customers yet.</div>}
        {customers.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-[#5C6A5E]">{c.address} {c.gstin && `· ${c.gstin}`}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(c)} className="text-xs px-2.5 py-1 border border-[#C9C2A8] rounded-sm hover:bg-[#E7E2D2]">Edit</button>
              <button onClick={() => remove(c.id)} className="text-xs px-2.5 py-1 border border-[#C9C2A8] rounded-sm hover:bg-[#E7E2D2] text-[#B0453A]">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Items ----------
function Items({ items, saveItems }) {
  const [form, setForm] = useState({ description: "", hsn: "", defaultRate: "", unit: "" });
  const [editId, setEditId] = useState(null);

  function submit() {
    if (!form.description.trim()) return;
    if (editId) {
      saveItems(items.map(i => (i.id === editId ? { ...i, ...form } : i)));
      setEditId(null);
    } else {
      saveItems([...items, { id: crypto.randomUUID(), ...form }]);
    }
    setForm({ description: "", hsn: "", defaultRate: "", unit: "" });
  }
  function edit(i) { setForm({ description: i.description, hsn: i.hsn, defaultRate: i.defaultRate, unit: i.unit || "" }); setEditId(i.id); }
  function remove(id) { saveItems(items.filter(i => i.id !== id)); }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold headline">Item master</h2>
      <div className="bg-white border border-[#C9C2A8] rounded-sm p-4 grid sm:grid-cols-4 gap-3">
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm" placeholder="HSN code" value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} />
        <input className="border border-[#C9C2A8] rounded-sm px-3 py-2 text-sm" placeholder="Default rate" value={form.defaultRate} onChange={(e) => setForm({ ...form, defaultRate: e.target.value })} />
        <button onClick={submit} className="sm:col-span-4 px-4 py-2 bg-[#1F2A30] text-white text-sm rounded-sm hover:bg-[#111A1F] w-fit">
          {editId ? "Update item" : "Add item"}
        </button>
      </div>
      <div className="bg-white border border-[#C9C2A8] rounded-sm divide-y divide-[#DED7C0]">
        {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#5C6A5E]">No items yet — items you bill also get added here automatically.</div>}
        {items.map(i => (
          <div key={i.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium">{i.description}</div>
              <div className="text-xs text-[#5C6A5E] mono">HSN {i.hsn || "—"} · ₹{i.defaultRate || "—"}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(i)} className="text-xs px-2.5 py-1 border border-[#C9C2A8] rounded-sm hover:bg-[#E7E2D2]">Edit</button>
              <button onClick={() => remove(i.id)} className="text-xs px-2.5 py-1 border border-[#C9C2A8] rounded-sm hover:bg-[#E7E2D2] text-[#B0453A]">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsPanel({ settings, saveSettings }) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold headline">Business settings</h2>
      <div className="bg-white border border-[#C9C2A8] rounded-sm p-4 space-y-3">
        <Field label="Company name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Address" value={form.addressLine} onChange={(v) => setForm({ ...form, addressLine: v })} />
        <Field label="Cell / phone" value={form.cell} onChange={(v) => setForm({ ...form, cell: v })} />
        <Field label="GSTIN" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} />
        <Field label="Jurisdiction (for footer note)" value={form.jurisdiction} onChange={(v) => setForm({ ...form, jurisdiction: v })} />
        <div>
          <label className="text-[11px] text-[#5C6A5E] mb-0.5 block">SGST / CGST split (%, each)</label>
          <input type="number" className="w-full mt-1 border border-[#C9C2A8] rounded-sm px-2.5 py-1.5 text-sm" value={form.gstSplit} onChange={(e) => setForm({ ...form, gstSplit: parseFloat(e.target.value) || 0 })} />
        </div>
        <button onClick={() => saveSettings(form)} className="px-4 py-2 bg-[#B5502F] text-white text-sm rounded-sm hover:bg-[#9C4327]">Save settings</button>
      </div>
    </div>
  );
}

// ---------- Print View ----------
function PrintView({ invoice, settings, onClose }) {
  const rows = Math.max(invoice.lines.length, 6);
  const padded = [...invoice.lines, ...Array(Math.max(0, rows - invoice.lines.length)).fill(null)];
  return (
    <div className="min-h-screen bg-[#DED7C0] py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
      <div className="no-print max-w-3xl mx-auto mb-4 flex justify-between px-4">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm px-3 py-2 border border-[#1F2A30] rounded-sm bg-white"><X size={15}/> Back</button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#B5502F] text-white rounded-sm" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}><Printer size={15}/> Print / Save PDF</button>
      </div>
      <div className="max-w-3xl mx-auto bg-white border-2 border-[#1F2A30] mono text-[12.5px] text-[#1F2A30]">

        {/* Header: logo + company */}
        <div className="flex items-center gap-4 p-3 border-b-2 border-[#1F2A30]">
          <img src={LOGO_DATA_URI} alt="Company seal logo" className="w-[72px] h-[72px] rounded-full object-cover shrink-0 border border-[#1F2A30]" />
          <div className="flex-1 text-center pr-[72px]">
            <div className="text-[26px] font-bold tracking-wide leading-tight" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{settings.name}</div>
            <div className="text-[11px] mt-1">{settings.addressLine}</div>
          </div>
        </div>

        {/* Cell / GSTIN / TAX INVOICE */}
        <div className="grid grid-cols-[1fr_1fr_150px] border-b-2 border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">Cell : {settings.cell || "—"}</div>
          <div className="p-2 border-r border-[#1F2A30]">GSTIN : {settings.gstin || "—"}</div>
          <div className="p-2 flex items-center justify-center text-center font-bold tracking-wide">TAX INVOICE</div>
        </div>

        {/* To M/s + No/Date */}
        <div className="grid grid-cols-[1fr_150px] border-b border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">
            <div>To, M/s. {invoice.customer.name}</div>
            <div>{invoice.customer.address}</div>
          </div>
          <div className="p-2">
            <div>No. : <b>{invoice.invoiceNo}</b></div>
            <div>Date : {invoice.date}</div>
          </div>
        </div>

        {/* Party's GSTIN */}
        <div className="p-2 border-b border-[#1F2A30]">
          Party's GSTIN : {invoice.customer.gstin || <span className="inline-block border-b border-dotted border-[#1F2A30] w-40">&nbsp;</span>}
        </div>

        {/* Order / DC */}
        <div className="grid grid-cols-2 border-b-2 border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">
            Your Order No. & Date : {invoice.orderNo || "—"} {invoice.orderDate && `(${invoice.orderDate})`}
          </div>
          <div className="p-2">
            Our DC. No. & Date : {invoice.dcNo || "—"} {invoice.dcDate && `(${invoice.dcDate})`}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#1F2A30]">
              <th className="border-r border-[#1F2A30] p-1.5 w-10 font-semibold">S. No.</th>
              <th className="border-r border-[#1F2A30] p-1.5 text-left font-semibold">Description of Goods</th>
              <th className="border-r border-[#1F2A30] p-1.5 w-20 font-semibold">HSN Code</th>
              <th className="border-r border-[#1F2A30] p-1.5 w-14 font-semibold">Qty.</th>
              <th className="border-r border-[#1F2A30] p-1.5 w-20 font-semibold">Rate Rs.</th>
              <th className="p-1.5 w-24 font-semibold">Amount Rs.</th>
            </tr>
          </thead>
          <tbody>
            {padded.map((l, idx) => (
              <tr key={idx} className="border-b border-[#C9C2A8]" style={{ height: "24px" }}>
                <td className="border-r border-[#1F2A30] p-1 text-center align-top">{l ? idx + 1 : ""}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top whitespace-pre-wrap">{l?.description}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top text-center">{l?.hsn}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top text-right">{l?.qty}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top text-right">{l ? money(l.rate) : ""}</td>
                <td className="p-1 align-top text-right">{l ? money(l.qty * l.rate) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rupees in words + totals box */}
        <div className="grid grid-cols-[1fr_150px] border-t-2 border-[#1F2A30]">
          <div className="p-2 flex items-start">
            <span><span className="font-semibold">Rupees</span> {numToWords(invoice.total)} rupees only.</span>
          </div>
          <div className="border-l border-[#1F2A30] divide-y divide-[#1F2A30]">
            <div className="flex justify-between px-2 py-1"><span>Sub Total</span><span>{money(invoice.subtotal)}</span></div>
            <div className="flex justify-between px-2 py-1"><span>SGST @{invoice.sgstPct}%</span><span>{money(invoice.sgst)}</span></div>
            <div className="flex justify-between px-2 py-1"><span>CGST @{invoice.cgstPct}%</span><span>{money(invoice.cgst)}</span></div>
            <div className="flex justify-between px-2 py-1 font-bold"><span>Total</span><span>{money(invoice.total)}</span></div>
          </div>
        </div>

        {/* Jurisdiction + signature & seal */}
        <div className="grid grid-cols-[1fr_240px] border-t-2 border-[#1F2A30]">
          <div className="p-2 text-[10px] text-[#5C6A5E] self-end">
            {settings.jurisdiction && `Subject to ${settings.jurisdiction} Jurisdiction`}
          </div>
          <div className="border-l border-[#1F2A30] p-3 text-center relative">
            <div className="font-medium mb-1">For {settings.name}</div>
            <div className="relative h-16 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-dashed border-[#5C6A5E] flex items-center justify-center text-[8px] text-[#5C6A5E] tracking-wide">SEAL</div>
            </div>
            <div className="border-t border-[#1F2A30] pt-1 mt-1">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintDCView({ dc, settings, onClose }) {
  const rows = Math.max(dc.lines.length, 6);
  const padded = [...dc.lines, ...Array(Math.max(0, rows - dc.lines.length)).fill(null)];
  return (
    <div className="min-h-screen bg-[#DED7C0] py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
      <div className="no-print max-w-3xl mx-auto mb-4 flex justify-between px-4">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm px-3 py-2 border border-[#1F2A30] rounded-sm bg-white"><X size={15}/> Back</button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#B5502F] text-white rounded-sm" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}><Printer size={15}/> Print / Save PDF</button>
      </div>
      <div className="max-w-3xl mx-auto bg-white border-2 border-[#1F2A30] mono text-[12.5px] text-[#1F2A30]">

        {/* Header: logo + company */}
        <div className="flex items-center gap-4 p-3 border-b-2 border-[#1F2A30]">
          <img src={LOGO_DATA_URI} alt="Company seal logo" className="w-[72px] h-[72px] rounded-full object-cover shrink-0 border border-[#1F2A30]" />
          <div className="flex-1 text-center pr-[72px]">
            <div className="text-[26px] font-bold tracking-wide leading-tight" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{settings.name}</div>
            <div className="text-[11px] mt-1">{settings.addressLine}</div>
          </div>
        </div>

        {/* Cell / GSTIN / DELIVERY CHALLAN */}
        <div className="grid grid-cols-[1fr_1fr_170px] border-b-2 border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">Cell : {settings.cell || "—"}</div>
          <div className="p-2 border-r border-[#1F2A30]">GSTIN : {settings.gstin || "—"}</div>
          <div className="p-2 flex items-center justify-center text-center font-bold tracking-wide">DELIVERY CHALLAN</div>
        </div>

        {/* To M/s + No/Date */}
        <div className="grid grid-cols-[1fr_170px] border-b border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">
            <div>To, M/s. {dc.customer.name}</div>
            <div>{dc.customer.address}</div>
            {dc.customer.gstin && <div>GSTIN: {dc.customer.gstin}</div>}
          </div>
          <div className="p-2">
            <div>DC No. : <b>{dc.dcNo}</b></div>
            <div>Date : {dc.date}</div>
          </div>
        </div>

        {/* Ref + purpose */}
        <div className="grid grid-cols-2 border-b-2 border-[#1F2A30]">
          <div className="p-2 border-r border-[#1F2A30]">Ref / Order No. : {dc.refNo || "—"}</div>
          <div className="p-2">Purpose : {dc.purpose}</div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#1F2A30]">
              <th className="border-r border-[#1F2A30] p-1.5 w-10 font-semibold">S. No.</th>
              <th className="border-r border-[#1F2A30] p-1.5 text-left font-semibold">Description of Goods</th>
              <th className="border-r border-[#1F2A30] p-1.5 w-20 font-semibold">HSN Code</th>
              <th className="p-1.5 w-20 font-semibold">Qty.</th>
            </tr>
          </thead>
          <tbody>
            {padded.map((l, idx) => (
              <tr key={idx} className="border-b border-[#C9C2A8]" style={{ height: "24px" }}>
                <td className="border-r border-[#1F2A30] p-1 text-center align-top">{l ? idx + 1 : ""}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top whitespace-pre-wrap">{l?.description}</td>
                <td className="border-r border-[#1F2A30] p-1 align-top text-center">{l?.hsn}</td>
                <td className="p-1 align-top text-right">{l?.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-2 text-[10px] border-t border-[#1F2A30] text-[#5C6A5E]">
          Note: Goods dispatched as above — no sale, for {dc.purpose.toLowerCase()} purposes only. GST not charged on this document.
        </div>

        {/* Jurisdiction + both signatures */}
        <div className="grid grid-cols-[1fr_170px_240px] border-t-2 border-[#1F2A30]">
          <div className="p-2 text-[10px] text-[#5C6A5E] self-end">
            {settings.jurisdiction && `Subject to ${settings.jurisdiction} Jurisdiction`}
          </div>
          <div className="border-l border-[#1F2A30] p-3 text-center flex flex-col justify-end">
            <div className="h-10"></div>
            <div className="border-t border-[#1F2A30] pt-1">Receiver's Signature</div>
          </div>
          <div className="border-l border-[#1F2A30] p-3 text-center relative">
            <div className="font-medium mb-1">For {settings.name}</div>
            <div className="relative h-14 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border border-dashed border-[#5C6A5E] flex items-center justify-center text-[8px] text-[#5C6A5E] tracking-wide">SEAL</div>
            </div>
            <div className="border-t border-[#1F2A30] pt-1 mt-1">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
